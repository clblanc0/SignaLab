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


def _safe_bids_id(value: str) -> str:
    return "".join(c for c in value if c.isalnum())


def _classify(file_paths: list[Path]) -> tuple[Optional[Path], Optional[Path]]:
    """Pick the first EEG file and the first behavioral file from the upload."""
    eeg: Optional[Path] = None
    behavior: Optional[Path] = None
    for p in file_paths:
        suffix = p.suffix.lower()
        if suffix in EEG_EXTS and eeg is None:
            eeg = p
        elif suffix in EVENT_EXTS and behavior is None:
            behavior = p
    return eeg, behavior


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
        eeg_path, behavior_path = _classify(file_paths)
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
            behavior_path.name if behavior_path else "(none)",
        )
        store.finish_stage(job_id, "Stream Detection", t)

        # 4. Clock Sync — match labels, fit drift. Skipped if no behavioral file.
        if behavior_path is None:
            store.skip_stage(job_id, "Clock Sync")
            store.skip_stage(job_id, "Event Merge")
            synced_events: list[BehavioralEvent] = []
        else:
            t = store.start_stage(job_id, "Clock Sync")
            csv_events = parse_events_csv(behavior_path)
            eeg_times = list(raw.annotations.onset) if raw.annotations else []
            eeg_labels = list(raw.annotations.description) if raw.annotations else []
            result, synced_events = align_events(eeg_times, eeg_labels, csv_events)
            store.attach_sync_meta(
                job_id,
                SyncMeta(
                    method=result.method,
                    offset_s=result.offset_s,
                    drift_rate=result.drift_rate,
                    matched_event_count=result.matched_event_count,
                    rms_residual_s=result.rms_residual_s,
                    warnings=result.warnings,
                ),
            )
            store.finish_stage(job_id, "Clock Sync", t)

            # 5. Event Merge — attach synced events to raw.
            t = store.start_stage(job_id, "Event Merge")
            _append_annotations(raw, synced_events)
            store.finish_stage(job_id, "Event Merge", t)

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
