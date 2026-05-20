import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, CheckCircle } from 'lucide-react';
import { DATASETS, QC_REPORTS, EEG_CHANNELS_64, FC_REGIONS, genFD, MODALITY_CONFIG } from '../mockData';
import { PIPELINE_TAGS, VIEWABLE_MODALITIES } from '../constants';

// ─── Signal generators ────────────────────────────────────────────────────────

function eegSample(chIdx, t, seed) {
  const s       = seed + chIdx * 7.31;
  const post    = chIdx >= 24 && chIdx <= 30; // occipital / posterior
  const central = chIdx >= 12 && chIdx <= 17;
  const delta   = Math.sin(2 * Math.PI * 2.1  * t + s * 0.31) * 7;
  const theta   = Math.sin(2 * Math.PI * 6.3  * t + s * 0.67) * 5;
  const alpha   = Math.sin(2 * Math.PI * 10.1 * t + s * 0.89) * (post ? 18 : 5);
  const mu      = Math.sin(2 * Math.PI * 11.2 * t + s * 0.91) * (central ? 9 : 2);
  const beta    = Math.sin(2 * Math.PI * 19.7 * t + s * 1.31) * 4;
  const noise   = (Math.sin(t * 1337.3 + s * 77.1) + Math.sin(t * 2011.7 + s * 43.3)) * 1.5;
  return delta + theta + alpha + mu + beta + noise;
}

function boldSample(netIdx, vol, seed, smooth = false) {
  const s      = seed + netIdx * 3.14;
  const period = 38 + netIdx * 8;
  const slow   = Math.sin(2 * Math.PI * vol / period + s) * 1.3;
  const slow2  = Math.sin(2 * Math.PI * vol / (period * 0.55) + s * 1.7) * 0.7;
  const noise  = smooth ? 0 : (Math.sin(vol * 173.7 + s * 51.3) + Math.sin(vol * 97.3 + s * 29.1)) * 0.18;
  return slow + slow2 + noise;
}

function ecgSample(t, hr = 68) {
  const period = 60 / hr;
  const phase  = (t % period) / period;
  const P  =  0.15  * Math.exp(-Math.pow((phase - 0.15) / 0.022, 2));
  const Q  = -0.10  * Math.exp(-Math.pow((phase - 0.36) / 0.011, 2));
  const R  =  1.00  * Math.exp(-Math.pow((phase - 0.39) / 0.009, 2));
  const S  = -0.18  * Math.exp(-Math.pow((phase - 0.42) / 0.011, 2));
  const T  =  0.28  * Math.exp(-Math.pow((phase - 0.62) / 0.042, 2));
  const noise = Math.sin(t * 1337.7 * 0.01) * 0.02;
  return (P + Q + R + S + T + noise) * 140;
}

function emgSample(chIdx, t, seed) {
  const s = seed + chIdx * 5.17;
  const burstPeriod = 1.1 + chIdx * 0.25;
  const phase = (t % burstPeriod) / burstPeriod;
  const inBurst = phase > 0.38 && phase < 0.68;
  const amp = inBurst ? 320 : 55;
  return (Math.sin(t * 1337.7 + s) * 0.5 + Math.sin(t * 2011.3 + s * 1.7) * 0.3 + Math.sin(t * 997.1 + s * 0.9) * 0.2) * amp;
}

// ─── Channel groups ───────────────────────────────────────────────────────────
const CHANNEL_GROUPS = {
  Frontal:   ['Fp1','Fp2','AF3','AFz','AF4','F5','F3','Fz','F4','F6'],
  Central:   ['FC3','FC1','FCz','FC2','FC4','C3','Cz','C4'],
  Temporal:  ['FT7','T7','TP7','FT8','T8','TP8'],
  Parietal:  ['CP3','CP1','CPz','CP2','CP4','P3','Pz','P4'],
  Occipital: ['PO7','PO3','POz','PO4','PO8','O1','Oz','O2'],
};

// ─── BOLD network colours ─────────────────────────────────────────────────────
const RSN_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#94a3b8'];

function PipelineBanner({ modality }) {
  const tags = PIPELINE_TAGS[modality] ?? [];
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pipeline</span>
      {tags.map((tag, i) => (
        <React.Fragment key={tag}>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle size={9} />
            {tag}
          </span>
          {i < tags.length - 2 && <span className="text-slate-300 text-xs">→</span>}
          {i === tags.length - 2 && <span className="text-slate-400 text-xs">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── EEG pane ────────────────────────────────────────────────────────────────
function EEGPane({ channels, badChannels, seed, timeOffset, windowSec, ampScale }) {
  const CH_H    = 58;
  const LABEL_W = 46;
  const SVG_W   = 800;
  const PLOT_W  = SVG_W - LABEL_W;
  const SVG_H   = channels.length * CH_H;
  const PTS     = 450;

  const traces = useMemo(() => channels.map((ch, idx) => {
    const gi   = EEG_CHANNELS_64.indexOf(ch);
    const s    = seed + (gi >= 0 ? gi : idx) * 7.31;
    const midY = (idx + 0.5) * CH_H;
    const bad  = badChannels.includes(ch);
    const pts  = [];
    for (let p = 0; p < PTS; p++) {
      const t = timeOffset + (p / PTS) * windowSec;
      const raw = eegSample(gi >= 0 ? gi : idx, t, s) * ampScale;
      const x = LABEL_W + (p / PTS) * PLOT_W;
      const y = Math.max(idx * CH_H + 2, Math.min((idx + 1) * CH_H - 2, midY - raw));
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return { ch, pts: pts.join(' '), bad, midY };
  }), [channels, timeOffset, windowSec, ampScale, seed, badChannels]);

  const tickCount = Math.min(windowSec, 10);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H + 14}`} className="w-full" style={{ minWidth: 500 }}>
        {/* Row backgrounds */}
        {channels.map((_, i) => (
          <rect key={i} x={0} y={i * CH_H} width={SVG_W} height={CH_H} fill={i % 2 === 0 ? '#f8fafc' : '#ffffff'} />
        ))}
        {/* Time grid */}
        {Array.from({ length: tickCount + 1 }, (_, i) => {
          const x = LABEL_W + (i / tickCount) * PLOT_W;
          return <line key={i} x1={x} y1={0} x2={x} y2={SVG_H} stroke="#e2e8f0" strokeWidth="0.6" />;
        })}
        {/* Traces */}
        {traces.map(({ ch, pts, bad, midY }, i) => (
          <g key={ch}>
            {bad && <rect x={LABEL_W} y={i * CH_H} width={PLOT_W} height={CH_H} fill="#fef2f2" opacity={0.7} />}
            <line x1={LABEL_W} y1={midY} x2={SVG_W} y2={midY} stroke="#e2e8f0" strokeWidth="0.5" />
            <polyline points={pts} fill="none"
              stroke={bad ? '#fca5a5' : '#0d9488'}
              strokeWidth={bad ? '0.7' : '0.9'}
              opacity={bad ? 0.55 : 1}
            />
            <text x={LABEL_W - 4} y={midY + 4} textAnchor="end" fontSize="9"
              fill={bad ? '#ef4444' : '#64748b'} fontFamily="monospace">
              {ch}{bad ? ' ✕' : ''}
            </text>
          </g>
        ))}
        {/* Amplitude scale indicator */}
        <line x1={14} y1={CH_H * 0.35} x2={14} y2={CH_H * 0.35 + 10 / ampScale * ampScale * 10}
          stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <text x={22} y={CH_H * 0.45} fontSize="7" fill="#94a3b8">10 µV</text>
        {/* X-axis time labels */}
        {Array.from({ length: tickCount + 1 }, (_, i) => {
          const x = LABEL_W + (i / tickCount) * PLOT_W;
          return (
            <text key={i} x={x} y={SVG_H + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {(timeOffset + (i / tickCount) * windowSec).toFixed(1)}s
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── BOLD pane ───────────────────────────────────────────────────────────────
function BOLDPane({ totalVolumes, scrubbedFDSeed, seed, offset, window: win, smooth }) {
  const SVG_W   = 800;
  const SVG_H   = 220;
  const PAD_L   = 36;
  const PAD_B   = 20;
  const PLOT_W  = SVG_W - PAD_L;
  const PLOT_H  = SVG_H - PAD_B;
  const PTS     = 300;
  const Y_RANGE = 3.2;

  const toX = (vol) => PAD_L + ((vol - offset) / win) * PLOT_W;
  const toY = (v)   => PLOT_H / 2 - (v / Y_RANGE) * (PLOT_H / 2);

  const fd = useMemo(() => genFD(totalVolumes, scrubbedFDSeed), [totalVolumes, scrubbedFDSeed]);
  const scrubbed = fd.map((v, i) => i).filter(i => fd[i] > 0.5 && i >= offset && i < offset + win);

  const traces = useMemo(() => FC_REGIONS.map((net, ni) => {
    const pts = [];
    const step = Math.max(1, Math.floor(win / PTS));
    for (let vol = offset; vol < Math.min(offset + win, totalVolumes); vol += step) {
      const v = boldSample(ni, vol, seed + ni * 2.71, smooth);
      pts.push(`${toX(vol).toFixed(1)},${toY(v).toFixed(1)}`);
    }
    return { net, pts: pts.join(' '), color: RSN_COLORS[ni] };
  }), [offset, win, smooth, seed, totalVolumes]);

  const yTicks = [-2, -1, 0, 1, 2];

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1 pb-2">
        {FC_REGIONS.map((net, i) => (
          <span key={net} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: RSN_COLORS[i] }} />
            {net}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minWidth: 500 }}>
          {/* Background */}
          <rect x={PAD_L} y={0} width={PLOT_W} height={PLOT_H} fill="#020617" rx="4" />
          {/* Scrubbed volume bands */}
          {scrubbed.map(vol => (
            <rect key={vol} x={toX(vol)} y={0} width={Math.max(2, PLOT_W / win)} height={PLOT_H}
              fill="#ef4444" opacity={0.18} />
          ))}
          {/* Y grid + labels */}
          {yTicks.map(v => {
            const y = toY(v);
            return (
              <g key={v}>
                <line x1={PAD_L} y1={y} x2={SVG_W} y2={y}
                  stroke={v === 0 ? '#334155' : '#1e293b'} strokeWidth={v === 0 ? '1' : '0.5'} />
                <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#475569">{v}</text>
              </g>
            );
          })}
          {/* Y-axis label */}
          <text x={8} y={PLOT_H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
            transform={`rotate(-90, 8, ${PLOT_H / 2})`}>z-score</text>
          {/* Network traces */}
          {traces.map(({ net, pts, color }) => (
            <polyline key={net} points={pts} fill="none" stroke={color} strokeWidth="1.1" opacity={0.85} />
          ))}
          {/* X-axis labels */}
          {Array.from({ length: 7 }, (_, i) => {
            const vol = offset + Math.round((i / 6) * win);
            const x   = toX(vol);
            return (
              <text key={i} x={x} y={SVG_H - 4} textAnchor="middle" fontSize="8" fill="#475569">
                {vol}
              </text>
            );
          })}
          <text x={PAD_L + PLOT_W / 2} y={SVG_H} textAnchor="middle" fontSize="8" fill="#475569">Volume (TR)</text>
          {/* Scrubbed legend */}
          {scrubbed.length > 0 && (
            <g>
              <rect x={SVG_W - 90} y={4} width={8} height={8} fill="#ef4444" opacity={0.5} rx="1" />
              <text x={SVG_W - 78} y={11} fontSize="8" fill="#94a3b8">Scrubbed vol.</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── ECG pane ────────────────────────────────────────────────────────────────
function ECGPane({ hr = 68, seed, timeOffset, windowSec, ampScale }) {
  const SVG_W = 800;
  const SVG_H = 100;
  const PAD_L = 8;
  const PLOT_W = SVG_W - PAD_L;
  const PLOT_H = SVG_H - 14;
  const PTS   = 600;
  const MID_Y = PLOT_H / 2;

  const { pts, peaks } = useMemo(() => {
    const ptsArr = [], peakArr = [];
    let prevSign = 1;
    for (let p = 0; p < PTS; p++) {
      const t = timeOffset + (p / PTS) * windowSec;
      const v = ecgSample(t, hr) * ampScale * 0.28;
      const x = PAD_L + (p / PTS) * PLOT_W;
      const y = MID_Y - v;
      ptsArr.push(`${x.toFixed(1)},${Math.max(2, Math.min(PLOT_H - 2, y)).toFixed(1)}`);
      const period = 60 / hr;
      const phase  = (t % period) / period;
      if (Math.abs(phase - 0.39) < 0.5 / PTS * windowSec / period) peakArr.push(x);
    }
    return { pts: ptsArr.join(' '), peaks: peakArr };
  }, [timeOffset, windowSec, ampScale, hr, seed]);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full bg-slate-950 rounded-lg" style={{ minWidth: 400 }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={PAD_L} y1={PLOT_H * f} x2={SVG_W} y2={PLOT_H * f}
            stroke="#1e293b" strokeWidth="0.5" />
        ))}
        <line x1={PAD_L} y1={MID_Y} x2={SVG_W} y2={MID_Y} stroke="#1e293b" strokeWidth="1" />
        {/* R-peak markers */}
        {peaks.map((x, i) => (
          <line key={i} x1={x} y1={4} x2={x} y2={PLOT_H - 4} stroke="#f59e0b" strokeWidth="0.7" opacity={0.4} />
        ))}
        {/* Trace */}
        <polyline points={pts} fill="none" stroke="#f43f5e" strokeWidth="1.2" />
        {/* HR readout */}
        <text x={SVG_W - 4} y={14} textAnchor="end" fontSize="10" fill="#f43f5e" fontWeight="bold">
          {hr} bpm
        </text>
        {/* X labels */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = PAD_L + (i / 5) * PLOT_W;
          return <text key={i} x={x} y={SVG_H - 2} textAnchor="middle" fontSize="7" fill="#475569">
            {(timeOffset + (i / 5) * windowSec).toFixed(1)}s
          </text>;
        })}
      </svg>
    </div>
  );
}

// ─── EMG pane ────────────────────────────────────────────────────────────────
const EMG_CHANNELS = ['TA-L','TA-R','RF-L','RF-R','BF-L','BF-R','GAS-L','GAS-R'];

function EMGPane({ seed, timeOffset, windowSec, ampScale }) {
  const CH_H   = 55;
  const LABEL_W = 50;
  const SVG_W  = 800;
  const PLOT_W = SVG_W - LABEL_W;
  const SVG_H  = EMG_CHANNELS.length * CH_H;
  const PTS    = 450;

  const traces = useMemo(() => EMG_CHANNELS.map((ch, idx) => {
    const s    = seed + idx * 5.17;
    const midY = (idx + 0.5) * CH_H;
    const pts  = [];
    for (let p = 0; p < PTS; p++) {
      const t = timeOffset + (p / PTS) * windowSec;
      const v = emgSample(idx, t, s) * ampScale * 0.12;
      const x = LABEL_W + (p / PTS) * PLOT_W;
      const y = Math.max(idx * CH_H + 2, Math.min((idx + 1) * CH_H - 2, midY - v));
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return { ch, pts: pts.join(' '), midY };
  }), [timeOffset, windowSec, ampScale, seed]);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H + 14}`} className="w-full" style={{ minWidth: 400 }}>
        {EMG_CHANNELS.map((_, i) => (
          <rect key={i} x={0} y={i * CH_H} width={SVG_W} height={CH_H} fill={i % 2 === 0 ? '#f8fafc' : '#fff'} />
        ))}
        {traces.map(({ ch, pts, midY }, i) => (
          <g key={ch}>
            <line x1={LABEL_W} y1={midY} x2={SVG_W} y2={midY} stroke="#e2e8f0" strokeWidth="0.5" />
            <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="0.85" />
            <text x={LABEL_W - 4} y={midY + 4} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">{ch}</text>
          </g>
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const x = LABEL_W + (i / 5) * PLOT_W;
          return <text key={i} x={x} y={SVG_H + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">
            {(timeOffset + (i / 5) * windowSec).toFixed(1)}s
          </text>;
        })}
      </svg>
    </div>
  );
}

function qcColor(s) {
  return s === 'pass' ? 'bg-emerald-400' : s === 'warn' ? 'bg-amber-400' : 'bg-red-400';
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function Visualizer() {
  const viewable = DATASETS.filter(d => d.modalities.some(m => VIEWABLE_MODALITIES.has(m)));

  const [selectedId, setSelectedId] = useState(viewable[3]?.id ?? viewable[0]?.id); // default EEG
  const [modality,   setModality]   = useState('EEG');
  const [chGroup,    setChGroup]    = useState('Frontal');
  const [windowSec,  setWindowSec]  = useState(10);
  const [timeOffset, setTimeOffset] = useState(0);
  const [ampScale,   setAmpScale]   = useState(1);
  const [boldOffset, setBoldOffset] = useState(0);
  const [boldWindow, setBoldWindow] = useState(150);
  const [smoothBOLD, setSmoothBOLD] = useState(false);

  const dataset  = DATASETS.find(d => d.id === selectedId);
  const qcReport = QC_REPORTS[dataset?.sessionId];
  const badCh    = qcReport?.EEG?.badChannels ?? [];
  const seed     = selectedId ? selectedId.charCodeAt(selectedId.length - 1) * 0.13 : 1;

  const availMods = dataset?.modalities.filter(m => VIEWABLE_MODALITIES.has(m)) ?? [];

  useEffect(() => {
    if (!availMods.includes(modality)) setModality(availMods[0] ?? 'EEG');
    setTimeOffset(0);
    setBoldOffset(0);
  }, [selectedId]);

  const TOTAL_SEC    = 60;
  const TOTAL_VOLS   = qcReport?.fMRI?.totalVolumes ?? 300;
  const FD_SEED      = qcReport?.fMRI?.fdSeed ?? 1;
  const ECG_HR       = qcReport?.ECG?.heartRate ?? 68;
  const eegChannels  = CHANNEL_GROUPS[chGroup] ?? CHANNEL_GROUPS.Frontal;

  const stepTime  = (dir) => setTimeOffset(prev => Math.max(0, Math.min(TOTAL_SEC - windowSec, prev + dir * windowSec * 0.5)));
  const stepBOLD  = (dir) => setBoldOffset(prev => Math.max(0, Math.min(TOTAL_VOLS - boldWindow, prev + dir * Math.round(boldWindow * 0.5))));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Signal Viewer</h1>
        <p className="text-slate-500 text-sm mt-0.5">Inspect normalized, standardized output data</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* ── Dataset picker ─────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Datasets</p>
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {viewable.map(d => {
                const active = d.id === selectedId;
                return (
                  <button key={d.id} onClick={() => setSelectedId(d.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${active ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50 border-l-2 border-transparent'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${qcColor(d.qcStatus)}`} />
                      <span className="text-sm font-semibold text-slate-900">{d.subject}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 ml-4 truncate">{d.id}</p>
                    <p className="text-xs text-slate-500 ml-4 mt-0.5 truncate">{d.paradigm}</p>
                    <div className="flex flex-wrap gap-1 ml-4 mt-1.5">
                      {d.modalities.map(m => (
                        <span key={m} className={`text-[9px] font-bold px-1 py-0.5 rounded ${MODALITY_CONFIG[m]?.bg} ${MODALITY_CONFIG[m]?.text}`}>{m}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dataset info */}
          {dataset && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Info</p>
              {[
                { label: 'Format',   value: dataset.outputFormat },
                { label: 'Rate',     value: dataset.samplingRate },
                { label: 'Channels', value: typeof dataset.channels === 'number' ? `${dataset.channels} ch` : dataset.channels },
                { label: 'Size',     value: dataset.fileSize },
                { label: 'QC',       value: dataset.qcStatus.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-semibold text-slate-700 font-mono">{value}</span>
                </div>
              ))}
              {badCh.length > 0 && (
                <div className="pt-1 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 mb-1">Bad channels (interpolated)</p>
                  <p className="text-[10px] text-red-500 font-mono leading-relaxed">{badCh.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Signal viewer ──────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

            {/* Modality tabs + controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                {availMods.map(m => (
                  <button key={m} onClick={() => { setModality(m); setTimeOffset(0); setBoldOffset(0); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      modality === m ? `${MODALITY_CONFIG[m]?.bg} ${MODALITY_CONFIG[m]?.text} shadow-sm` : 'text-slate-500 hover:text-slate-800'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>

              {modality === 'EEG' && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Channel group */}
                  <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {Object.keys(CHANNEL_GROUPS).map(g => (
                      <button key={g} onClick={() => setChGroup(g)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${chGroup === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                  {/* Window */}
                  <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {[5, 10, 30].map(w => (
                      <button key={w} onClick={() => setWindowSec(w)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${windowSec === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                        {w}s
                      </button>
                    ))}
                  </div>
                  {/* Amplitude */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setAmpScale(s => Math.max(0.25, s - 0.25))}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                      <Minus size={12} />
                    </button>
                    <span className="text-[10px] font-mono text-slate-500 w-8 text-center">{ampScale.toFixed(2)}×</span>
                    <button onClick={() => setAmpScale(s => Math.min(4, s + 0.25))}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}

              {modality === 'fMRI' && (
                <div className="flex items-center gap-3">
                  <button onClick={() => setSmoothBOLD(v => !v)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${smoothBOLD ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    Smoothed
                  </button>
                  <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {[75, 150, 300].map(w => (
                      <button key={w} onClick={() => setBoldWindow(Math.min(w, TOTAL_VOLS))}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${boldWindow === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                        {w} vol
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline banner */}
            <PipelineBanner modality={modality} />

            {/* Signal area */}
            <div className="p-4">
              {modality === 'EEG' && (
                <>
                  <EEGPane
                    channels={eegChannels}
                    badChannels={badCh}
                    seed={seed}
                    timeOffset={timeOffset}
                    windowSec={windowSec}
                    ampScale={ampScale}
                  />
                  {/* Time scrubber */}
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => stepTime(-1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronLeft size={16} /></button>
                    <input type="range" min={0} max={Math.max(0, TOTAL_SEC - windowSec)} step={0.5}
                      value={timeOffset}
                      onChange={e => setTimeOffset(parseFloat(e.target.value))}
                      className="flex-1 accent-teal-500" />
                    <button onClick={() => stepTime(1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronRight size={16} /></button>
                    <span className="text-xs font-mono text-slate-500 w-16 text-right">t = {timeOffset.toFixed(1)} s</span>
                  </div>
                </>
              )}

              {modality === 'fMRI' && (
                <>
                  <BOLDPane
                    totalVolumes={TOTAL_VOLS}
                    scrubbedFDSeed={FD_SEED}
                    seed={seed}
                    offset={boldOffset}
                    window={boldWindow}
                    smooth={smoothBOLD}
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => stepBOLD(-1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronLeft size={16} /></button>
                    <input type="range" min={0} max={Math.max(0, TOTAL_VOLS - boldWindow)} step={1}
                      value={boldOffset}
                      onChange={e => setBoldOffset(parseInt(e.target.value))}
                      className="flex-1 accent-blue-500" />
                    <button onClick={() => stepBOLD(1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronRight size={16} /></button>
                    <span className="text-xs font-mono text-slate-500 w-24 text-right">vol {boldOffset}–{boldOffset + boldWindow}</span>
                  </div>
                </>
              )}

              {modality === 'ECG' && (
                <>
                  <ECGPane hr={ECG_HR} seed={seed} timeOffset={timeOffset} windowSec={windowSec} ampScale={ampScale} />
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => stepTime(-1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronLeft size={16} /></button>
                    <input type="range" min={0} max={Math.max(0, TOTAL_SEC - windowSec)} step={0.5}
                      value={timeOffset} onChange={e => setTimeOffset(parseFloat(e.target.value))}
                      className="flex-1 accent-rose-500" />
                    <button onClick={() => stepTime(1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronRight size={16} /></button>
                    <span className="text-xs font-mono text-slate-500 w-16 text-right">t = {timeOffset.toFixed(1)} s</span>
                  </div>
                </>
              )}

              {modality === 'EMG' && (
                <>
                  <EMGPane seed={seed} timeOffset={timeOffset} windowSec={windowSec} ampScale={ampScale} />
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => stepTime(-1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronLeft size={16} /></button>
                    <input type="range" min={0} max={Math.max(0, TOTAL_SEC - windowSec)} step={0.5}
                      value={timeOffset} onChange={e => setTimeOffset(parseFloat(e.target.value))}
                      className="flex-1 accent-violet-500" />
                    <button onClick={() => stepTime(1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><ChevronRight size={16} /></button>
                    <span className="text-xs font-mono text-slate-500 w-16 text-right">t = {timeOffset.toFixed(1)} s</span>
                  </div>
                </>
              )}

              {!modality && (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  <p>Select a dataset to begin viewing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
