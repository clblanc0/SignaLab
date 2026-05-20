import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Download, GitMerge } from 'lucide-react';
import { MODALITY_CONFIG } from '../mockData';
import { PIPELINE_STATUS_FILTERS } from '../constants';
import { countByStatus, formatElapsedTime } from '../utils';
import { fetchJobs, downloadUrl } from '../../api';

function SyncPanel({ meta }) {
  const driftMsPerSec = meta.driftRate * 1000;
  const methodLabel = {
    linear: 'Linear fit (offset + drift)',
    constant: 'Constant offset only',
    no_sync: 'No alignment — events as-is',
  }[meta.method] ?? meta.method;
  return (
    <div className="mt-3 p-3 bg-white border border-brand-violet/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <GitMerge size={13} className="text-brand-violet" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Sync
        </span>
        <span className="text-[10px] font-mono text-slate-600">{meta.fileName}</span>
        <span className="text-[10px] font-mono text-slate-400">· {methodLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SyncMetric label="Offset" value={`${meta.offsetS.toFixed(3)} s`} />
        <SyncMetric label="Drift" value={`${driftMsPerSec.toFixed(2)} ms/s`} />
        <SyncMetric label="Anchors" value={String(meta.matchedEventCount)} />
        <SyncMetric
          label="RMS residual"
          value={meta.rmsResidualS != null ? `${(meta.rmsResidualS * 1000).toFixed(2)} ms` : '—'}
        />
        <SyncMetric label="Deduped" value={String(meta.dedupedEventCount ?? 0)} />
      </div>
      {meta.warnings?.length > 0 && (
        <div className="mt-2 space-y-1">
          {meta.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-700">
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncMetric({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function statusBadge(status) {
  const map = {
    running:  { cls: 'bg-teal-50 text-teal-700 border-teal-200',    label: 'Running'  },
    queued:   { cls: 'bg-slate-50 text-slate-600 border-slate-200',  label: 'Queued'   },
    complete: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Complete' },
    failed:   { cls: 'bg-red-50 text-red-700 border-red-200',        label: 'Failed'   },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-slate-50 text-slate-500', label: status };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function StageIcon({ status }) {
  if (status === 'done')    return <CheckCircle size={14} className="text-emerald-500" />;
  if (status === 'failed')  return <XCircle size={14} className="text-red-500" />;
  if (status === 'warn')    return <AlertTriangle size={14} className="text-amber-500" />;
  if (status === 'running') return <RefreshCw size={14} className="text-teal-500 animate-spin" />;
  if (status === 'skip')    return <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />;
  return <Clock size={14} className="text-slate-300" />;
}

function StagePipeline({ stages }) {
  return (
    <div className="flex items-start gap-0 mt-3 mb-1 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const connectorColor =
          stage.status === 'done' ? 'bg-emerald-300' :
          stage.status === 'failed' ? 'bg-red-300' :
          'bg-slate-200';
        return (
          <div key={stage.name} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <StageIcon status={stage.status} />
              <span className="text-[10px] text-slate-500 text-center leading-tight max-w-[70px]">
                {stage.name}
              </span>
              {stage.duration != null && (
                <span className="text-[9px] font-mono text-slate-400">{stage.duration}s</span>
              )}
            </div>
            {!isLast && (
              <div className={`h-px w-8 mx-1 mt-[-16px] ${connectorColor}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function JobRow({ job }) {
  const [expanded, setExpanded] = useState(job.status === 'running');

  const elapsed = formatElapsedTime(job.startedAt);

  return (
    <div className={`border border-slate-100 rounded-xl overflow-hidden transition-all ${
      job.status === 'running' ? 'border-teal-200 shadow-sm shadow-teal-50' : ''
    }`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        {/* Job ID + session */}
        <div className="w-24 flex-shrink-0">
          <p className="text-xs font-mono font-bold text-slate-900">{job.id}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{job.sessionId}</p>
        </div>

        {/* Subject */}
        <div className="w-20 flex-shrink-0">
          <p className="text-sm font-semibold text-slate-900">{job.subject}</p>
        </div>

        {/* Modalities */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {job.modalities.map(m => (
            <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${MODALITY_CONFIG[m].bg} ${MODALITY_CONFIG[m].text}`}>
              {m}
            </span>
          ))}
        </div>

        {/* Progress bar (for running) */}
        {job.status === 'running' && (
          <div className="w-32 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Progress</span>
              <span className="text-[10px] font-mono font-bold text-teal-600">{job.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Format */}
        <div className="w-24 flex-shrink-0 hidden md:block">
          <span className="text-xs text-slate-500">{job.format}</span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">{statusBadge(job.status)}</div>

        {/* Elapsed */}
        {elapsed && (
          <div className="w-16 flex-shrink-0 text-right hidden lg:block">
            <span className="text-xs font-mono text-slate-400">{elapsed}</span>
          </div>
        )}

        {/* Expand */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pipeline Stages</p>
          <StagePipeline stages={job.stages} />
          {job.syncMetas?.map((m, i) => <SyncPanel key={i} meta={m} />)}
          {job.error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{job.error}</p>
            </div>
          )}
          {job.status === 'complete' && (
            <a
              href={downloadUrl(job.id)}
              download
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Download size={13} />
              Download BIDS dataset (.zip)
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Pipeline() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setJobs(await fetchJobs());
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  const counts = countByStatus(jobs);

  const visible = filter === 'all'
    ? jobs
    : jobs.filter(j => j.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time job queue and processing status</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Backend unreachable: {error}. Make sure the FastAPI server is running on port 8000.
          </p>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit">
        {PIPELINE_STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === s
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {s}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs list */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Clock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No {filter} jobs</p>
          </div>
        ) : (
          visible.map(job => <JobRow key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
