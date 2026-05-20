"""EDF → BIDS-EEG conversion pipeline.

Phase 1 is intentionally narrow: one input format (EDF), one output format
(BIDS-EEG via mne-bids), packaged as a zip for download. Each stage updates
the JobStore so the frontend can poll progress.
"""

from __future__ import annotations

import logging
import shutil
import zipfile
from pathlib import Path
from typing import Optional

import mne
from mne_bids import BIDSPath, write_raw_bids

from .jobs import store

log = logging.getLogger(__name__)

STAGE_NAMES = ["Ingestion", "Format Parsing", "BIDS Standardization", "Packaging"]


def _safe_bids_id(value: str) -> str:
    """BIDS labels must be alphanumeric. Strip everything else."""
    return "".join(c for c in value if c.isalnum())


def run_pipeline(
    job_id: str,
    file_paths: list[Path],
    subject_id: str,
    paradigm: Optional[str],
    output_dir: Path,
) -> None:
    store.mark_running(job_id)
    try:
        # 1. Ingestion — confirm files are on disk and recognized.
        t = store.start_stage(job_id, "Ingestion")
        if not file_paths:
            raise ValueError("No input files provided")
        primary = file_paths[0]
        if not primary.exists():
            raise FileNotFoundError(primary)
        if primary.suffix.lower() != ".edf":
            raise ValueError(
                f"Phase 1 only supports .edf input; got {primary.suffix}"
            )
        store.finish_stage(job_id, "Ingestion", t)

        # 2. Format Parsing — open with MNE.
        t = store.start_stage(job_id, "Format Parsing")
        raw = mne.io.read_raw_edf(str(primary), preload=False, verbose="WARNING")
        if raw.info.get("line_freq") is None:
            raw.info["line_freq"] = 60.0
        store.finish_stage(job_id, "Format Parsing", t)

        # 3. BIDS Standardization — mne-bids writes the canonical folder.
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

        # 4. Packaging — zip the BIDS dataset for download.
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
