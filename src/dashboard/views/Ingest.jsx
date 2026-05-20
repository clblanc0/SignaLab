import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, FileText, ChevronDown, GitMerge, Timer, Gauge } from 'lucide-react';
import { DEVICE_FORMATS, MODALITY_CONFIG } from '../mockData';
import { INGEST_MODALITIES, PARADIGMS } from '../constants';
import { detectRecordingFormat, detectRecordingModality } from '../utils';
import { fetchJobs, submitIngest } from '../../api';

const SYNC_STEPS = [
  { label: 'Detect stream clocks', detail: 'EEG sample index + behavioral timestamp columns' },
  { label: 'Align event markers', detail: 'stimulus onset, response, task state, or sensor events' },
  { label: 'Estimate drift', detail: 'linear correction: +18 ms over 28:33' },
  { label: 'Export synchronized epochs', detail: 'NWB behavior module linked to EEG/EMG' },
];

export default function Ingest({ onNavigate }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [paradigm, setParadigm] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [recentIngestions, setRecentIngestions] = useState([]);
  const inputRef = useRef();
  const includesBehavior = files.some(file => file.modality === 'BEH') || paradigm === 'Driving Simulation';
  const includesPhysiology = files.some(file => ['EEG', 'EMG', 'ECG'].includes(file.modality));

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then(jobs => { if (!cancelled) setRecentIngestions(jobs.slice(0, 5)); })
      .catch(() => { /* backend down — leave list empty */ });
    return () => { cancelled = true; };
  }, [submitted]);

  const addFiles = (incoming) => {
    const parsed = Array.from(incoming).map(f => ({
      raw: f,
      name: f.name,
      size: (f.size / 1e6).toFixed(1),
      modality: detectRecordingModality(f.name),
      format: detectRecordingFormat(f.name),
    }));
    setFiles(prev => [...prev, ...parsed]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!files.length || !subjectId.trim()) return;
    setSubmitError(null);
    setSubmitted(true);
    try {
      const uniqueModalities = Array.from(new Set(files.map(f => f.modality).filter(Boolean)));
      await submitIngest({
        files: files.map(f => f.raw),
        subjectId: subjectId.trim(),
        paradigm: paradigm || undefined,
        notes: notes || undefined,
        modalities: uniqueModalities,
      });
      setTimeout(() => {
        setFiles([]);
        setSubjectId('');
        setParadigm('');
        setNotes('');
        setSubmitted(false);
        onNavigate('pipeline');
      }, 900);
    } catch (err) {
      setSubmitError(err.message || String(err));
      setSubmitted(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ingest Recording</h1>
        <p className="text-slate-500 text-sm mt-0.5">Upload raw biosignal files and launch the standardization pipeline</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Upload + metadata */}
        <div className="lg:col-span-2 space-y-5">

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
              dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragOver ? 'bg-teal-100' : 'bg-slate-100'}`}>
                <Upload size={24} className={dragOver ? 'text-teal-600' : 'text-slate-400'} />
              </div>
              <p className="text-slate-900 font-semibold mb-1">
                {dragOver ? 'Release to add files' : 'Drop recording files here'}
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Supports BrainVision, BDF, EDF, HDF5, CSV/TSV/JSON time-series
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Browse files
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept=".vhdr,.vmrk,.eeg,.bdf,.edf,.mff,.h5,.hdf5,.csv,.tsv,.txt,.json"
                onChange={e => addFiles(e.target.files)}
              />
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{files.length} file{files.length !== 1 ? 's' : ''} queued</span>
                <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <FileText size={15} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.size} MB</p>
                    </div>
                    <ModalitySelect
                      value={f.modality}
                      onChange={v => setFiles(prev => prev.map((x, j) => j === i ? { ...x, modality: v } : x))}
                    />
                    <FormatSelect
                      value={f.format}
                      onChange={v => setFiles(prev => prev.map((x, j) => j === i ? { ...x, format: v } : x))}
                    />
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Session Metadata</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Subject ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  placeholder="e.g. SUB-042"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Paradigm
                </label>
                <div className="relative">
                  <select
                    value={paradigm}
                    onChange={e => setParadigm(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select paradigm…</option>
                    {PARADIGMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Electrode placement notes, session conditions, protocol deviations…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <SyncPreview
            active={includesBehavior}
            ready={includesBehavior && includesPhysiology}
          />

          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{submitError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!files.length || !subjectId.trim() || submitted}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              submitted
                ? 'bg-emerald-500 text-white'
                : files.length && subjectId.trim()
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitted ? '✓ Queued — redirecting to pipeline…' : 'Run Pipeline'}
          </button>
        </div>

        {/* Right: Format guide + recent */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Supported Formats</h3>
            <div className="space-y-2">
              {DEVICE_FORMATS.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{f.label.split(' (')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-400">{f.exts[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Recent Ingestions</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {recentIngestions.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400">
                  No ingestions yet — upload a recording to get started.
                </div>
              ) : recentIngestions.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  {r.status === 'complete'
                    ? <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                    : r.status === 'failed'
                    ? <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    : <Timer size={14} className="text-teal-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{r.subject}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{r.id} · {r.format}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${
                    r.status === 'complete' ? 'text-emerald-600' :
                    r.status === 'failed' ? 'text-red-500' :
                    'text-teal-600'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalitySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-xs font-bold border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 ${
        MODALITY_CONFIG[value]?.bg ?? 'bg-slate-100'
      } ${MODALITY_CONFIG[value]?.text ?? 'text-slate-600'} border-transparent`}
    >
      {INGEST_MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

function FormatSelect({ value, onChange }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="text-xs text-slate-600 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white max-w-[120px]"
    >
      <option value="">Unknown</option>
      {DEVICE_FORMATS.map(f => <option key={f.id} value={f.id}>{f.id.toUpperCase()}</option>)}
    </select>
  );
}

function SyncPreview({ active, ready }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${
      active ? 'border-brand-violet/25 shadow-glowViolet' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            active ? 'bg-brand-violet/10 text-brand-violet' : 'bg-slate-100 text-slate-400'
          }`}>
            <GitMerge size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Post-experiment time-series sync</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Pair task events, response logs, kinematics, simulator data, or wearable streams with EEG, EMG, or ECG after collection.
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded border ${
          ready
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : active
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {ready ? 'Ready to sync' : active ? 'Needs physiology stream' : 'Available'}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <SyncMetric icon={Timer} label="EEG stream" value="250-1000 Hz" />
        <SyncMetric icon={Gauge} label="Behavior stream" value="events or sampled data" />
        <SyncMetric icon={GitMerge} label="Alignment basis" value="timestamps + events" />
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {SYNC_STEPS.map((step, index) => (
          <div key={step.label} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className={`mt-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              ready || index < 2 ? 'bg-brand-violet text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {index + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-800">{step.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2.5">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Icon size={13} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
