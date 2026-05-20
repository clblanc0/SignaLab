"""In-memory job store with progress tracking.

Phase 1 scope: process-local store keyed by job_id. Phase 2 can swap in
a persistent backend (sqlite, redis) behind the same interface.
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

JobStatus = Literal["queued", "running", "complete", "failed"]
StageStatus = Literal["pending", "running", "done", "failed", "skip"]


class Stage(BaseModel):
    name: str
    status: StageStatus = "pending"
    duration: Optional[float] = None


class SyncMeta(BaseModel):
    file_name: str
    method: str  # "linear" | "constant" | "no_sync"
    offset_s: float
    drift_rate: float  # slope - 1 (dimensionless)
    matched_event_count: int
    rms_residual_s: Optional[float] = None
    deduped_event_count: int = 0
    warnings: list[str] = Field(default_factory=list)


class Job(BaseModel):
    id: str
    subject_id: str
    paradigm: Optional[str] = None
    notes: Optional[str] = None
    modalities: list[str] = Field(default_factory=list)
    source_format: Optional[str] = None
    source_files: list[str] = Field(default_factory=list)
    status: JobStatus = "queued"
    progress: int = 0
    stages: list[Stage] = Field(default_factory=list)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    output_path: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
    sync_metas: list[SyncMeta] = Field(default_factory=list)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class JobStore:
    """Thread-safe, in-memory store. Pipeline workers update jobs from a
    background thread; the API reads them from the request thread."""

    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def create(
        self,
        *,
        subject_id: str,
        paradigm: Optional[str],
        notes: Optional[str],
        source_files: list[str],
        source_format: Optional[str],
        modalities: list[str],
        stage_names: list[str],
    ) -> Job:
        job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
        job = Job(
            id=job_id,
            subject_id=subject_id,
            paradigm=paradigm,
            notes=notes,
            source_files=source_files,
            source_format=source_format,
            modalities=modalities,
            stages=[Stage(name=n) for n in stage_names],
        )
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def list(self) -> list[Job]:
        with self._lock:
            return sorted(
                self._jobs.values(),
                key=lambda j: j.started_at or "",
                reverse=True,
            )

    def mark_running(self, job_id: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "running"
            job.started_at = _now_iso()

    def start_stage(self, job_id: str, stage_name: str) -> float:
        """Mark a stage as running and return the start time (monotonic)."""
        import time

        with self._lock:
            job = self._jobs[job_id]
            for stage in job.stages:
                if stage.name == stage_name:
                    stage.status = "running"
                    break
        return time.monotonic()

    def finish_stage(
        self, job_id: str, stage_name: str, start_t: float, *, ok: bool = True
    ) -> None:
        import time

        duration = round(time.monotonic() - start_t, 2)
        with self._lock:
            job = self._jobs[job_id]
            for stage in job.stages:
                if stage.name == stage_name:
                    stage.status = "done" if ok else "failed"
                    stage.duration = duration
                    break
            done = sum(1 for s in job.stages if s.status in ("done", "skip"))
            job.progress = int(100 * done / len(job.stages)) if job.stages else 0

    def skip_stage(self, job_id: str, stage_name: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            for stage in job.stages:
                if stage.name == stage_name:
                    stage.status = "skip"
                    break
            done = sum(1 for s in job.stages if s.status in ("done", "skip"))
            job.progress = int(100 * done / len(job.stages)) if job.stages else 0

    def attach_sync_meta(self, job_id: str, meta: SyncMeta) -> None:
        with self._lock:
            self._jobs[job_id].sync_metas.append(meta)

    def mark_complete(self, job_id: str, *, output_path: str, download_url: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "complete"
            job.progress = 100
            job.completed_at = _now_iso()
            job.output_path = output_path
            job.download_url = download_url

    def mark_failed(self, job_id: str, error: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "failed"
            job.completed_at = _now_iso()
            job.error = error
            for stage in job.stages:
                if stage.status == "running":
                    stage.status = "failed"
                elif stage.status == "pending":
                    stage.status = "skip"


store = JobStore()
