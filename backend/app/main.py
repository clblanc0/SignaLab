"""SignaLab FastAPI app — Phase 1.

Routes:
  POST /api/ingest               — upload files + metadata, start pipeline
  GET  /api/jobs                 — list jobs (most recent first)
  GET  /api/jobs/{job_id}        — get one job
  GET  /api/datasets/{job_id}/download — download zipped BIDS dataset
  GET  /api/health               — liveness check
"""

from __future__ import annotations

import logging
import shutil
import threading
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .jobs import Job, store
from .pipeline import STAGE_NAMES, run_pipeline

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
log = logging.getLogger("signalab")

BACKEND_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BACKEND_ROOT / "data" / "uploads"
OUTPUT_DIR = BACKEND_ROOT / "data" / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(title="SignaLab", version="0.1.0")

# Vite dev server origin — allow direct calls from the browser during dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/jobs")
def list_jobs() -> dict[str, list[Job]]:
    return {"jobs": store.list()}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> Job:
    job = store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/api/ingest", status_code=201)
async def ingest(
    files: list[UploadFile] = File(...),
    subject_id: str = Form(...),
    paradigm: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    modalities: Optional[str] = Form(None),  # comma-separated, e.g. "EEG,ECG"
) -> Job:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Persist uploads under a fresh job-scoped directory so re-runs don't collide.
    job_dir_name = f"upload_{subject_id}_{len(list(UPLOAD_DIR.iterdir()))}"
    upload_dir = UPLOAD_DIR / job_dir_name
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved_paths: list[Path] = []
    for upload in files:
        dest = upload_dir / Path(upload.filename or "unnamed").name
        with dest.open("wb") as fh:
            shutil.copyfileobj(upload.file, fh)
        saved_paths.append(dest)

    modality_list = (
        [m.strip() for m in modalities.split(",") if m.strip()]
        if modalities
        else ["EEG"]
    )
    primary_ext = saved_paths[0].suffix.lower().lstrip(".")

    job = store.create(
        subject_id=subject_id,
        paradigm=paradigm,
        notes=notes,
        source_files=[p.name for p in saved_paths],
        source_format=primary_ext.upper() if primary_ext else None,
        modalities=modality_list,
        stage_names=STAGE_NAMES,
    )

    # Run the pipeline off the event loop so the response returns immediately
    # and other API calls (status polling) stay responsive.
    threading.Thread(
        target=run_pipeline,
        args=(job.id, saved_paths, subject_id, paradigm, OUTPUT_DIR),
        daemon=True,
        name=f"pipeline-{job.id}",
    ).start()

    log.info("Ingest queued: %s (subject=%s, files=%d)", job.id, subject_id, len(files))
    return job


@app.get("/api/datasets/{job_id}/download")
def download_dataset(job_id: str) -> FileResponse:
    job = store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "complete":
        raise HTTPException(
            status_code=409,
            detail=f"Dataset not ready (job status: {job.status})",
        )
    zip_path = OUTPUT_DIR / f"{job_id}_bids.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Dataset archive missing on disk")
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"signalab_{job.subject_id}_{job_id}_bids.zip",
    )
