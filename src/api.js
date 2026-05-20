// Client for the SignaLab backend.
//
// All calls go through the Vite proxy (`/api` → http://localhost:8000) so the
// frontend stays origin-agnostic. The adapter shapes backend responses to match
// the field names the existing UI components expect (subject, sessionId, etc).

const API_BASE = '/api';

function adaptJob(job) {
  return {
    id: job.id,
    sessionId: job.id,
    subject: job.subject_id,
    paradigm: job.paradigm,
    modalities: job.modalities?.length ? job.modalities : ['EEG'],
    format: job.source_format || '—',
    status: job.status,
    progress: job.progress,
    stages: job.stages,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    downloadUrl: job.download_url,
    outputPath: job.output_path,
    error: job.error,
    syncMeta: job.sync_meta ? {
      method: job.sync_meta.method,
      offsetS: job.sync_meta.offset_s,
      driftRate: job.sync_meta.drift_rate,
      matchedEventCount: job.sync_meta.matched_event_count,
      rmsResidualS: job.sync_meta.rms_residual_s,
      warnings: job.sync_meta.warnings || [],
    } : null,
  };
}

async function asJson(res) {
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.detail || ''; } catch { /* noop */ }
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export async function fetchJobs() {
  const data = await asJson(await fetch(`${API_BASE}/jobs`));
  return (data.jobs || []).map(adaptJob);
}

export async function fetchJob(id) {
  const data = await asJson(await fetch(`${API_BASE}/jobs/${id}`));
  return adaptJob(data);
}

export async function submitIngest({ files, subjectId, paradigm, notes, modalities }) {
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  fd.append('subject_id', subjectId);
  if (paradigm) fd.append('paradigm', paradigm);
  if (notes) fd.append('notes', notes);
  if (modalities?.length) fd.append('modalities', modalities.join(','));
  const data = await asJson(await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    body: fd,
  }));
  return adaptJob(data);
}

export function downloadUrl(jobId) {
  return `${API_BASE}/datasets/${jobId}/download`;
}
