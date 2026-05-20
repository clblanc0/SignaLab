import React, { useState } from 'react';
import { Search, Download, Eye, CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { DATASETS, MODALITY_CONFIG } from '../mockData';
import { DATASET_FILTER_MODALITIES } from '../constants';
import { fileSizeToMB, formatDate, formatRelativeTime } from '../utils';

function QCBadge({ status }) {
  const map = {
    pass: { icon: CheckCircle,  cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    warn: { icon: AlertTriangle,cls: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'     },
    fail: { icon: XCircle,      cls: 'text-red-600',     bg: 'bg-red-50 border-red-200'         },
  };
  const { icon: Icon, cls, bg } = map[status] ?? map.warn;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${bg} ${cls}`}>
      <Icon size={11} />
      {status}
    </span>
  );
}

export default function Datasets({ onNavigate }) {
  const [search, setSearch]         = useState('');
  const [modalityFilter, setMF]     = useState('all');
  const [qcFilter, setQC]           = useState('all');
  const [sortBy, setSort]           = useState('date');
  const [previewId, setPreviewId]   = useState(null);

  const filtered = DATASETS
    .filter(d => {
      const q = search.toLowerCase();
      if (q && !d.name.toLowerCase().includes(q) && !d.subject.toLowerCase().includes(q) && !d.paradigm.toLowerCase().includes(q)) return false;
      if (modalityFilter !== 'all' && !d.modalities.includes(modalityFilter)) return false;
      if (qcFilter !== 'all' && d.qcStatus !== qcFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date')    return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'subject') return a.subject.localeCompare(b.subject);
      if (sortBy === 'size')    return fileSizeToMB(b.fileSize) - fileSizeToMB(a.fileSize);
      return 0;
    });

  const preview = previewId ? DATASETS.find(d => d.id === previewId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Datasets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Standardized NWB outputs ready for analysis</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-2">
          <Database size={15} className="text-teal-500" />
          <span className="font-semibold text-slate-900">{DATASETS.length}</span> datasets
          <span className="mx-1 text-slate-300">|</span>
          <span className="font-semibold text-slate-900">
            {DATASETS.reduce((a, d) => a + fileSizeToMB(d.fileSize), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MB
          </span> total
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, name, paradigm…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        {/* Modality filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-lg p-0.5">
          {['all', ...DATASET_FILTER_MODALITIES].map(m => (
            <button
              key={m}
              onClick={() => setMF(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                modalityFilter === m
                  ? m === 'all' ? 'bg-slate-900 text-white' : `${MODALITY_CONFIG[m]?.bg} ${MODALITY_CONFIG[m]?.text}`
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {m === 'all' ? 'All' : m}
            </button>
          ))}
        </div>

        {/* QC filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-lg p-0.5">
          {['all', 'pass', 'warn', 'fail'].map(q => (
            <button
              key={q}
              onClick={() => setQC(q)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                qcFilter === q
                  ? q === 'all' ? 'bg-slate-900 text-white'
                    : q === 'pass' ? 'bg-emerald-500 text-white'
                    : q === 'warn' ? 'bg-amber-400 text-white'
                    : 'bg-red-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {q === 'all' ? 'All QC' : q}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSort(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
        >
          <option value="date">Sort: Newest</option>
          <option value="subject">Sort: Subject</option>
          <option value="size">Sort: Size</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Database size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No datasets match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Dataset','Subject','Modalities','Format / Rate','Size','QC','Created','Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 text-xs max-w-[200px] truncate font-mono">{d.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900">{d.subject}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {d.modalities.map(m => (
                          <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${MODALITY_CONFIG[m].bg} ${MODALITY_CONFIG[m].text}`}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 font-medium">{d.outputFormat}</p>
                      <p className="text-xs text-slate-400">{d.samplingRate}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {d.fileSize}
                    </td>
                    <td className="px-5 py-3.5">
                      <QCBadge status={d.qcStatus} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-xs text-slate-600">{formatDate(d.createdAt)}</p>
                      <p className="text-[10px] text-slate-400">{formatRelativeTime(d.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewId(d.id === previewId ? null : d.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 transition-colors"
                          title="Download NWB"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dataset preview panel */}
      {preview && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{preview.name}</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{preview.id}</p>
            </div>
            <button onClick={() => setPreviewId(null)} className="text-slate-400 hover:text-slate-700 text-xs font-medium">
              Close ×
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Subject',       value: preview.subject           },
              { label: 'Paradigm',      value: preview.paradigm          },
              { label: 'Channels',      value: `${preview.channels} ch`  },
              { label: 'Sampling Rate', value: preview.samplingRate       },
              { label: 'Output Format', value: preview.outputFormat       },
              { label: 'File Size',     value: preview.fileSize          },
              { label: 'QC Status',     value: preview.qcStatus.toUpperCase() },
              { label: 'Tags',          value: preview.tags.join(', ') || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              <Download size={14} />
              Download NWB
            </button>
            <button
              onClick={() => onNavigate('qc')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              View QC Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
