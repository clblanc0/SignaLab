"""Standardization pipeline.

Phase 2 extends the original 4-stage EDF→BIDS pipeline with three new stages
that handle paired EEG + behavioral CSV uploads:

  Ingestion → Format Parsing → Stream Detection → Clock Sync →
  Event Merge → BIDS Standardization → Packaging

When the user uploads only an EEG file, Clock Sync and Event Merge skip
cleanly (their stage cards show as "skipped" in the UI) and the pipeline
runs identically to Phase 1.

When both files are present, Clock Sync runs the alignment algorithm
(see app/sync.py) and Event Merge attaches the synced events to the MNE
raw object as annotations — mne-bids then emits them in events.tsv.
"""

from __future__ import annotations

import logging
import shutil
import zipfile
from pathlib import Path
from typing import Optional

import mne
from mne_bids import BIDSPath, write_raw_bids

from .csv_events import BehavioralEvent, parse_events_csv
from .jobs import SyncMeta, store
from .sync import align_events

log = logging.getLogger(__name__)

STAGE_NAMES = [
    "Ingestion",
    "Format Parsing",
    "Stream Detection",
    "Clock Sync",
    "Event Merge",
    "BIDS Standardization",
    "Packaging",
]

EEG_EXTS = {".edf"}  # Phase 2 still EDF-only on the EEG side
EVENT_EXTS = {".csv", ".tsv"}
DEDUPE_TOLERANCE_S = 0.05  # ±50 ms — within sample quantization for typical EEG


def _safe_bids_id(value: str) -> str:
    return "".join(c for c in value if c.isalnum())


def _classify(file_paths: list[Path]) -> tuple[Optional[Path], list[Path]]:
    """Pick the first EEG file and ALL behavioral files from the upload."""
    eeg: Optional[Path] = None
    behaviors: list[Path] = []
    for p in file_paths:
        suffix = p.suffix.lower()
        if suffix in EEG_EXTS and eeg is None:
            eeg = p
        elif suffix in EVENT_EXTS:
            behaviors.append(p)
    return eeg, behaviors


def _dedupe_against_existing(
    new_events: list[BehavioralEvent],
    existing_times: list[float],
    existing_labels: list[str],
    tolerance_s: float = DEDUPE_TOLERANCE_S,
) -> tuple[list[BehavioralEvent], int]:
    """Drop new events that collide with an existing annotation (same normalized
    label, within ±tolerance_s on the EEG clock). Returns (kept, dropped_count).

    Rationale: when EEG triggers and a CSV both record the same instant, we
    prefer the EEG's timestamp (authoritative clock) and the CSV's row would
    be a literal duplicate on `events.tsv`. Without this pass downstream BIDS
    consumers would see e.g. two `stim_onset` rows 0.4 ms apart.
    """
    from .sync import _norm

    by_label: dict[str, list[float]] = {}
    for t, lbl in zip(existing_times, existing_labels):
        by_label.setdefault(_norm(lbl), []).append(t)

    kept: list[BehavioralEvent] = []
    dropped = 0
    for ev in new_events:
        bucket = by_label.get(_norm(ev.label), [])
        if any(abs(t - ev.onset) <= tolerance_s for t in bucket):
            dropped += 1
            continue
        kept.append(ev)
    return kept, dropped


def _append_annotations(raw: mne.io.BaseRaw, events: list[BehavioralEvent]) -> None:
    """Add behavioral events as MNE annotations so write_raw_bids emits them.

    MNE's EDF reader stamps annotations with `orig_time` (defaulting to the
    1985 epoch if the recording header omits it). New annotations default to
    `orig_time=None`, which prevents concatenation — so we mirror whatever
    the existing annotations use.
    """
    if not events:
        return
    orig_time = raw.annotations.orig_time if raw.annotations is not None else None
    new = mne.Annotations(
        onset=[e.onset for e in events],
        duration=[max(e.duration, 0.0) for e in events],
        description=[e.label for e in events],
        orig_time=orig_time,
    )
    raw.set_annotations(
        (raw.annotations if raw.annotations is not None else mne.Annotations([], [], [], orig_time=orig_time))
        + new
    )


def run_pipeline(
    job_id: str,
    file_paths: list[Path],
    subject_id: str,
    paradigm: Optional[str],
    output_dir: Path,
) -> None:
    store.mark_running(job_id)
    try:
        # 1. Ingestion — confirm files on disk.
        t = store.start_stage(job_id, "Ingestion")
        if not file_paths:
            raise ValueError("No input files provided")
        for p in file_paths:
            if not p.exists():
                raise FileNotFoundError(p)
        store.finish_stage(job_id, "Ingestion", t)

        # 2. Format Parsing — open EEG with MNE.
        t = store.start_stage(job_id, "Format Parsing")
        eeg_path, behavior_paths = _classify(file_paths)
        if eeg_path is None:
            raise ValueError(
                f"No EEG file found; supported: {sorted(EEG_EXTS)}"
            )
        raw = mne.io.read_raw_edf(str(eeg_path), preload=False, verbose="WARNING")
        if raw.info.get("line_freq") is None:
            raw.info["line_freq"] = 60.0
        store.finish_stage(job_id, "Format Parsing", t)

        # 3. Stream Detection — figure out roles.
        t = store.start_stage(job_id, "Stream Detection")
        log.info(
            "Streams: eeg=%s, behavior=%s",
            eeg_path.name,
            ",".join(p.name for p in behavior_paths) if behavior_paths else "(none)",
        )
        store.finish_stage(job_id, "Stream Detection", t)

        # 4-5. Clock Sync + Event Merge — once per behavioral file. Skipped if none.
        if not behavior_paths:
            store.skip_stage(job_id, "Clock Sync")
            store.skip_stage(job_id, "Event Merge")
        else:
            sync_t = store.start_stage(job_id, "Clock Sync")
            merge_t: Optional[float] = None
            for behavior_path in behavior_paths:
                csv_events = parse_events_csv(behavior_path)
                eeg_times = list(raw.annotations.onset) if raw.annotations else []
                eeg_labels = list(raw.annotations.description) if raw.annotations else []
                result, synced_events = align_events(eeg_times, eeg_labels, csv_events)

                # Dedupe collisions with whatever annotations are now on raw
                # (EEG-native plus any earlier behavioral files we already merged).
                if result.method != "no_sync":
                    synced_events, dropped = _dedupe_against_existing(
                        synced_events, eeg_times, eeg_labels
                    )
                else:
                    dropped = 0

                store.attach_sync_meta(
                    job_id,
                    SyncMeta(
                        file_name=behavior_path.name,
                        method=result.method,
                        offset_s=result.offset_s,
                        drift_rate=result.drift_rate,
                        matched_event_count=result.matched_event_count,
                        rms_residual_s=result.rms_residual_s,
                        deduped_event_count=dropped,
                        warnings=result.warnings,
                    ),
                )

                # Event Merge runs once across all files; start its timer on the
                # first iteration so the stage card shows total merge time.
                if merge_t is None:
                    store.finish_stage(job_id, "Clock Sync", sync_t)
                    merge_t = store.start_stage(job_id, "Event Merge")
                _append_annotations(raw, synced_events)

            assert merge_t is not None
            store.finish_stage(job_id, "Event Merge", merge_t)

        # 6. BIDS Standardization.
        t = store.start_stage(job_id, "BIDS Standardization")
        bids_root = output_dir / f"bids_{job_id}"
        if bids_root.exists():
            shutil.rmtree(bids_root)
        task = _safe_bids_id(paradigm) if paradigm else ""
        bids_path = BIDSPath(
            subject=_safe_bids_id(subject_id) or "001",
            task=task or "rest",
            root=str(bids_root),
            datatype="eeg",
        )
        write_raw_bids(raw, bids_path, overwrite=True, verbose=False)
        store.finish_stage(job_id, "BIDS Standardization", t)

        # 7. Packaging — zip for download.
        t = store.start_stage(job_id, "Packaging")
        zip_path = output_dir / f"{job_id}_bids.zip"
        if zip_path.exists():
            zip_path.unlink()
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in bids_root.rglob("*"):
                if p.is_file():
                    zf.write(p, p.relative_to(bids_root.parent))
        store.finish_stage(job_id, "Packaging", t)

        store.mark_complete(
            job_id,
            output_path=str(bids_root),
            download_url=f"/api/datasets/{job_id}/download",
        )
    except Exception as exc:  # noqa: BLE001 — surface any failure to the UI
        log.exception("Pipeline failed for job %s", job_id)
        store.mark_failed(job_id, error=f"{type(exc).__name__}: {exc}")
