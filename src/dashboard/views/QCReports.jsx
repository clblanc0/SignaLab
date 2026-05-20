import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Activity, Brain } from 'lucide-react';
import {
  SESSIONS, QC_REPORTS, EEG_CHANNELS_64, MODALITY_CONFIG,
  FC_REGIONS, FC_REGION_LABELS, genFD,
} from '../mockData';

const QC_SESSIONS = SESSIONS.filter(s => QC_REPORTS[s.id]);

// ─── Shared helpers ───────────────────────────────────────────────────────────
function OverallBadge({ status }) {
  const map = {
    pass: { icon: CheckCircle,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', ic: 'text-emerald-500' },
    warn: { icon: AlertTriangle,cls: 'bg-amber-50 text-amber-700 border-amber-200',       ic: 'text-amber-500'   },
    fail: { icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-200',             ic: 'text-red-500'     },
  };
  const { icon: Icon, cls, ic } = map[status] ?? map.warn;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-lg border ${cls}`}>
      <Icon size={14} className={ic} />QC {status.toUpperCase()}
    </span>
  );
}

function MetricRow({ label, value, unit, status }) {
  const dot = { pass: 'bg-emerald-400', warn: 'bg-amber-400', fail: 'bg-red-400' }[status] ?? 'bg-slate-300';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold font-mono text-slate-900">
        {value}{unit ? <span className="text-slate-400 font-normal text-xs ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

function NoteBox({ text }) {
  return (
    <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-relaxed">
      ℹ {text}
    </div>
  );
}

// ─── EEG components ───────────────────────────────────────────────────────────
function EEGChannelGrid({ impedance, badChannels }) {
  const [hovered, setHovered] = useState(null);
  const getColor = ch => {
    if (badChannels?.includes(ch)) return 'bg-red-400';
    const v = impedance?.[ch] ?? 0;
    if (v < 5) return 'bg-emerald-400';
    if (v < 15) return 'bg-amber-400';
    return 'bg-red-400';
  };
  return (
    <div>
      <div className="grid grid-cols-8 gap-1">
        {EEG_CHANNELS_64.map(ch => (
          <div key={ch}
            className={`relative aspect-square rounded flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 ${getColor(ch)}`}
            onMouseEnter={() => setHovered(ch)} onMouseLeave={() => setHovered(null)}>
            <span className="text-[7px] font-bold text-white/80 leading-none text-center px-0.5">{ch}</span>
          </div>
        ))}
      </div>
      {hovered && (
        <div className="mt-3 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg inline-block font-mono">
          {hovered} — {impedance?.[hovered]?.toFixed(1) ?? 'N/A'} kΩ
          {impedance?.[hovered] > 25 ? ' ⚠ Disconnected' : ''}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400"/>{'<5 kΩ'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"/>{'5–15 kΩ'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-400">{''}</span>{'>15 kΩ'}</span>
      </div>
    </div>
  );
}

function EEGWaveform({ seed = 1, quality = 'pass' }) {
  const W = 360, H = 56;
  const color = quality === 'pass' ? '#10b981' : quality === 'warn' ? '#f59e0b' : '#ef4444';
  const makePath = s => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const y = H / 2 + Math.sin(t * Math.PI * 18 + s) * 8
                      + Math.sin(t * Math.PI * 44 + s * 1.7) * 4
                      + Math.sin(t * 133 + s * 3.2) * 2;
      pts.push(`${i === 0 ? 'M' : 'L'} ${(t * W).toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-14 rounded-lg bg-slate-950">
      {[0, 1, 2].map(i => (
        <path key={i} d={makePath(seed + i * 1.9)} fill="none" stroke={color} strokeWidth="0.9" opacity={0.8 - i * 0.2} />
      ))}
    </svg>
  );
}

function BandBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-slate-500 w-10">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{pct}%</span>
    </div>
  );
}

// ─── fMRI: Framewise Displacement plot ───────────────────────────────────────
function FDPlot({ seed, totalVolumes, scrubbedVolumes, meanFD, maxFD }) {
  const W = 400, H = 60, THRESHOLD = 0.5;
  const fd = genFD(totalVolumes, seed);
  const yMax = Math.max(maxFD * 1.15, THRESHOLD * 1.4);
  const toY = v => H - (v / yMax) * H;
  const toX = i => (i / (fd.length - 1)) * W;

  const linePath = fd.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const threshY = toY(THRESHOLD);
  const scrubbed = fd.map((v, i) => ({ v, i })).filter(p => p.v > THRESHOLD);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Framewise Displacement (FD)
        </span>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-red-400 inline-block"/>0.5 mm threshold</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>{scrubbedVolumes} scrubbed</span>
        </div>
      </div>
      <div className="bg-slate-950 rounded-lg p-2 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 70 }}>
          {/* scrubbed volume markers */}
          {scrubbed.map(({ i }) => (
            <rect key={i} x={toX(i) - 1} y={0} width={2} height={H} fill="#ef4444" opacity={0.25} />
          ))}
          {/* threshold line */}
          <line x1={0} y1={threshY} x2={W} y2={threshY} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4 3" />
          {/* FD trace */}
          <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
          {/* y-axis labels */}
          <text x={3} y={threshY - 3} fill="#ef4444" fontSize={7} opacity={0.8}>0.5 mm</text>
          <text x={3} y={H - 3} fill="#94a3b8" fontSize={7}>0</text>
        </svg>
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
        <span>Vol 0</span>
        <span>mean FD: {meanFD} mm</span>
        <span>Vol {totalVolumes}</span>
      </div>
    </div>
  );
}

// ─── fMRI: Functional Connectivity Matrix ────────────────────────────────────
function FCMatrix({ matrix }) {
  const [hovered, setHovered] = useState(null);

  const toRGB = v => {
    const clamped = Math.max(-1, Math.min(1, v));
    if (clamped >= 0) {
      const t = clamped;
      return `rgb(${Math.round(220 - t * 80)}, ${Math.round(30 + t * 20)}, ${Math.round(30 + t * 20)})`;
    } else {
      const t = -clamped;
      return `rgb(${Math.round(30 + t * 20)}, ${Math.round(80 + t * 40)}, ${Math.round(220 - t * 40)})`;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Functional Connectivity (Pearson r)
        </span>
        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: toRGB(-0.8) }} />
          <span>−1</span>
          <div className="w-10 h-2 rounded mx-1" style={{
            background: 'linear-gradient(to right, rgb(30,100,220), white, rgb(220,30,30))'
          }} />
          <span>+1</span>
          <span className="w-3 h-3 rounded-sm inline-block ml-1" style={{ background: toRGB(0.8) }} />
        </div>
      </div>

      {/* Column headers */}
      <div className="flex ml-9 mb-0.5">
        {FC_REGIONS.map(r => (
          <div key={r} className="flex-1 text-center text-[8px] font-bold text-slate-400 leading-tight">{r}</div>
        ))}
      </div>

      {/* Matrix rows */}
      <div className="space-y-0.5">
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-slate-400 w-8 text-right flex-shrink-0">{FC_REGIONS[i]}</span>
            <div className="flex flex-1 gap-0.5">
              {row.map((v, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                  style={{ backgroundColor: toRGB(v), aspectRatio: '1' }}
                  onMouseEnter={() => setHovered({ i, j, v })}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {hovered && (
        <div className="mt-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded font-mono inline-block">
          {FC_REGIONS[hovered.i]} ({FC_REGION_LABELS[FC_REGIONS[hovered.i]]}) ×{' '}
          {FC_REGIONS[hovered.j]} ({FC_REGION_LABELS[FC_REGIONS[hovered.j]]})
          {' '}— r = {hovered.v.toFixed(2)}
        </div>
      )}

      <div className="mt-3 grid grid-cols-5 gap-x-3 gap-y-1">
        {FC_REGIONS.map(r => (
          <div key={r} className="text-[9px] text-slate-500">
            <span className="font-bold text-slate-600">{r}</span> {FC_REGION_LABELS[r]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── fMRI section ─────────────────────────────────────────────────────────────
function FMRISection({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-blue-500" />
          <h3 className="font-semibold text-slate-900">fMRI — BOLD</h3>
          <span className="text-xs text-slate-400 font-mono">{data.parcellation}</span>
        </div>
        <OverallBadge status={data.status} />
      </div>

      {data.note && <NoteBox text={data.note} />}

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'tSNR',             value: data.tSNR,            unit: '',   good: v => v > 60,    warn: v => v > 40 },
          { label: 'Mean FD',          value: data.meanFD,          unit: ' mm',good: v => v < 0.2,   warn: v => v < 0.5 },
          { label: 'Scrubbed volumes', value: `${data.scrubbedVolumes}/${data.totalVolumes}`, unit: '', good: v => data.scrubbedVolumes < 5, warn: () => data.scrubbedVolumes < 20 },
          { label: 'DVARS',            value: data.dvars,           unit: '',   good: v => v < 1.5,   warn: v => v < 2.5 },
        ].map(({ label, value, unit, good, warn }) => {
          const numVal = typeof value === 'number' ? value : data.scrubbedVolumes;
          const statusCls = good(numVal) ? 'border-emerald-200 bg-emerald-50' : warn(numVal) ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50';
          const textCls   = good(numVal) ? 'text-emerald-700' : warn(numVal) ? 'text-amber-700' : 'text-red-700';
          return (
            <div key={label} className={`border rounded-xl p-3 ${statusCls}`}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-lg font-bold font-mono ${textCls}`}>{value}{unit}</p>
            </div>
          );
        })}
      </div>

      {/* Motion plot */}
      <FDPlot
        seed={data.fdSeed}
        totalVolumes={data.totalVolumes}
        scrubbedVolumes={data.scrubbedVolumes}
        meanFD={data.meanFD}
        maxFD={data.maxFD}
      />

      {/* FC matrix */}
      <div>
        <FCMatrix matrix={data.fcMatrix} />
      </div>

      {/* Coverage + ghosting */}
      <div className="grid grid-cols-2 gap-0">
        <MetricRow label="Brain mask coverage" value={data.boldCoverage} unit="%" status={data.boldCoverage > 98 ? 'pass' : 'warn'} />
        <MetricRow label="Ghosting ratio (g-factor)" value={data.ghostingRatio} status={data.ghostingRatio < 0.02 ? 'pass' : 'warn'} />
      </div>
    </div>
  );
}

// ─── sMRI section ─────────────────────────────────────────────────────────────
function SMRISection({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-indigo-500" />
          <h3 className="font-semibold text-slate-900">sMRI — T1w Structural</h3>
          {data.scanner && <span className="text-xs text-slate-400">{data.scanner}</span>}
        </div>
        <OverallBadge status={data.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-0">
        <MetricRow label="Contrast-to-noise ratio (CNR)" value={data.cnr}              status={data.cnr > 3.5 ? 'pass' : data.cnr > 2.5 ? 'warn' : 'fail'} />
        <MetricRow label="Signal-to-noise ratio (SNR)"   value={data.snr}   unit=" dB" status={data.snr > 18 ? 'pass' : data.snr > 12 ? 'warn' : 'fail'}  />
        <MetricRow label="MNI normalization quality"      value={data.warpQuality}      status="pass" />
        <MetricRow label="Euler number (surface topology)"value={data.eulerNumber}      status={data.eulerNumber > -100 ? 'pass' : 'warn'} />
        <MetricRow label="Mean cortical thickness"        value={data.corticalThickness} status="pass" />
        <MetricRow label="White matter volume"            value={data.wmVolume}          status="pass" />
        <MetricRow label="Grey matter volume"             value={data.gmVolume}          status="pass" />
        {data.resolution && <MetricRow label="Acquisition resolution" value={data.resolution} status="pass" />}
      </div>
    </div>
  );
}

// ─── EEG section ──────────────────────────────────────────────────────────────
function EEGSection({ data, sessionSeed }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-teal-500" />
          <h3 className="font-semibold text-slate-900">EEG</h3>
        </div>
        <OverallBadge status={data.status} />
      </div>
      {data.note && <NoteBox text={data.note} />}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signal Preview (3 channels)</p>
        <EEGWaveform seed={sessionSeed} quality={data.status} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Channel Impedance Map ({EEG_CHANNELS_64.length}ch)</p>
          <EEGChannelGrid impedance={data.impedance} badChannels={data.badChannels} />
          {data.badChannels?.length > 0 && (
            <div className="mt-3 text-xs text-red-600 font-medium">Bad channels removed: {data.badChannels.join(', ')}</div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quality Metrics</p>
          <MetricRow label="SNR"                 value={data.snr}                unit=" dB" status={data.snr > 20 ? 'pass' : data.snr > 10 ? 'warn' : 'fail'} />
          <MetricRow label="Line noise rejection" value={data.lineNoise}          unit=" dB" status={data.lineNoise > 35 ? 'pass' : 'warn'} />
          <MetricRow label="Artifact rate"        value={data.artifactRate}       unit="%"   status={data.artifactRate < 15 ? 'pass' : data.artifactRate < 35 ? 'warn' : 'fail'} />
          <MetricRow label="Epoch rejection rate" value={data.epochRejectionRate} unit="%"   status={data.epochRejectionRate < 20 ? 'pass' : 'warn'} />
          <MetricRow label="Bad channels"         value={data.badChannels?.length ?? 0} unit={`/ ${EEG_CHANNELS_64.length}`} status={data.badChannels?.length < 4 ? 'pass' : data.badChannels?.length < 10 ? 'warn' : 'fail'} />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2">Band Power Distribution</p>
          <div className="space-y-2">
            {[
              { label: 'δ Delta', key: 'delta', color: 'bg-indigo-400' },
              { label: 'θ Theta', key: 'theta', color: 'bg-blue-400'   },
              { label: 'α Alpha', key: 'alpha', color: 'bg-teal-400'   },
              { label: 'β Beta',  key: 'beta',  color: 'bg-violet-400' },
              { label: 'γ Gamma', key: 'gamma', color: 'bg-rose-400'   },
            ].map(b => <BandBar key={b.key} label={b.label} pct={data.bandPower[b.key]} color={b.color} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ECGSection({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-rose-500" />
          <h3 className="font-semibold text-slate-900">ECG</h3>
        </div>
        <OverallBadge status={data.status} />
      </div>
      <div className="grid sm:grid-cols-2 gap-0">
        <MetricRow label="Heart rate"            value={data.heartRate.toFixed(1)}            unit=" bpm" status="pass" />
        <MetricRow label="HRV — SDNN"            value={data.hrv_sdnn.toFixed(1)}             unit=" ms"  status={data.hrv_sdnn > 40 ? 'pass' : 'warn'} />
        <MetricRow label="HRV — RMSSD"           value={data.hrv_rmssd.toFixed(1)}            unit=" ms"  status={data.hrv_rmssd > 30 ? 'pass' : 'warn'} />
        <MetricRow label="Signal quality index"  value={(data.signalQualityIndex * 100).toFixed(0)} unit="%" status={data.signalQualityIndex > 0.85 ? 'pass' : 'warn'} />
      </div>
    </div>
  );
}

function EMGSection({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-violet-500" />
          <h3 className="font-semibold text-slate-900">EMG</h3>
        </div>
        <OverallBadge status={data.status} />
      </div>
      <MetricRow label="Active channels"  value={`${data.activeChannels} / 8`} status="pass" />
      <MetricRow label="SNR"              value={data.snr}     unit=" dB" status={data.snr > 25 ? 'pass' : 'warn'} />
      <MetricRow label="RMS noise"        value={data.rmsNoise} unit=" µV" status={data.rmsNoise < 3 ? 'pass' : 'warn'} />
      <MetricRow label="Amplitude range"  value={data.amplitudeRange}         status="pass" />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function QCReports() {
  const [selectedId, setSelectedId] = useState(QC_SESSIONS[0]?.id);
  const session = QC_SESSIONS.find(s => s.id === selectedId);
  const report  = QC_REPORTS[selectedId];
  const sessionSeed = selectedId ? selectedId.charCodeAt(selectedId.length - 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QC Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Signal quality metrics and artifact analysis</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Session list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions</p>
            </div>
            <div className="divide-y divide-slate-50">
              {QC_SESSIONS.map(s => {
                const rpt = QC_REPORTS[s.id];
                const active = s.id === selectedId;
                const dotColor = rpt?.overallStatus === 'pass' ? 'bg-emerald-400' : rpt?.overallStatus === 'warn' ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${active ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50 border-l-2 border-transparent'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <span className="text-sm font-semibold text-slate-900">{s.subject}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 ml-4">{s.id}</p>
                    <p className="text-xs text-slate-500 ml-4 mt-0.5">{s.paradigm}</p>
                    <div className="flex flex-wrap gap-1 ml-4 mt-1.5">
                      {s.modalities.map(m => (
                        <span key={m} className={`text-[9px] font-bold px-1 py-0.5 rounded ${MODALITY_CONFIG[m]?.bg} ${MODALITY_CONFIG[m]?.text}`}>{m}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report detail */}
        <div className="lg:col-span-3 space-y-5">
          {session && report ? (
            <>
              {/* Header */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{session.subject} — {session.paradigm}</h2>
                    <p className="text-sm text-slate-500 font-mono mt-0.5">{session.id} · {session.device}</p>
                    {session.imaging && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.imaging.matrix} · TR {session.imaging.tr} · {session.imaging.resolution}
                        {session.imaging.volumes > 1 ? ` · ${session.imaging.volumes} vol` : ''}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {session.modalities.map(m => (
                        <span key={m} className={`text-xs font-bold px-2 py-0.5 rounded ${MODALITY_CONFIG[m]?.bg} ${MODALITY_CONFIG[m]?.text}`}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <OverallBadge status={report.overallStatus} />
                </div>
              </div>

              {report.fMRI  && <FMRISection  data={report.fMRI}  />}
              {report.sMRI  && <SMRISection  data={report.sMRI}  />}
              {report.EEG   && <EEGSection   data={report.EEG}   sessionSeed={sessionSeed} />}
              {report.ECG   && <ECGSection   data={report.ECG}   />}
              {report.EMG   && <EMGSection   data={report.EMG}   />}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <p>Select a session to view the QC report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
