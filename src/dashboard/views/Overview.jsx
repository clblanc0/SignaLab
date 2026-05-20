import React from 'react';
import { TrendingUp, Clock, CheckCircle, Zap, Database, ArrowUpRight, Activity } from 'lucide-react';
import { OVERVIEW_STATS, RECENT_ACTIVITY, SESSIONS, MODALITY_CONFIG } from '../mockData';
import { countModalities } from '../utils';

const StatCard = ({ label, value, unit, icon: Icon, trend, color = 'teal' }) => {
  const colors = {
    teal:    { bg: 'bg-teal-50',   icon: 'text-teal-600',   border: 'border-teal-100' },
    emerald: { bg: 'bg-emerald-50',icon: 'text-emerald-600',border: 'border-emerald-100' },
    blue:    { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    violet:  { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
  };
  const c = colors[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
          <Icon size={16} className={c.icon} />
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-slate-500 mb-0.5 font-medium">{unit}</span>}
      </div>
      {trend && (
        <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
          <ArrowUpRight size={12} />{trend}
        </p>
      )}
    </div>
  );
};

const ActivityDot = ({ type }) => {
  const map = {
    complete: 'bg-emerald-500',
    running:  'bg-teal-400 animate-pulse',
    warn:     'bg-amber-400',
    fail:     'bg-red-500',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${map[type] ?? 'bg-slate-300'}`} />;
};

const ModalityBar = ({ label, count, total, config }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.bg} ${config.text} w-14 text-center`}>
        {label}
      </span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${config.dot}`}
          style={{ width: `${pct}%`, transition: 'width 1s ease' }}
        />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{count}</span>
    </div>
  );
};

export default function Overview({ onNavigate }) {
  const modalityCounts = countModalities(SESSIONS);
  const totalModalityUses = Object.values(modalityCounts).reduce((a, b) => a + b, 0);

  const recentSessions = SESSIONS.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Lab-wide pipeline status and activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Sessions Processed"
          value={OVERVIEW_STATS.totalSessions.toLocaleString()}
          icon={Database}
          trend="+12 this week"
          color="teal"
        />
        <StatCard
          label="QC Pass Rate"
          value={OVERVIEW_STATS.qcPassRate}
          unit="%"
          icon={CheckCircle}
          trend="+2.1% vs last month"
          color="emerald"
        />
        <StatCard
          label="Avg Processing Time"
          value={OVERVIEW_STATS.avgProcessingTime}
          unit="sec"
          icon={Zap}
          trend="↓ 0.4s improvement"
          color="blue"
        />
        <StatCard
          label="Output Datasets"
          value={OVERVIEW_STATS.outputDatasets.toLocaleString()}
          icon={TrendingUp}
          trend={`${OVERVIEW_STATS.subjectsEnrolled} subjects enrolled`}
          color="violet"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
            >
              View pipeline <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map(item => (
              <div key={item.id} className="flex items-start gap-3">
                <ActivityDot type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.sessionId} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modality Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Modality Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(modalityCounts).map(([mod, count]) => (
              <ModalityBar
                key={mod}
                label={mod}
                count={count}
                total={totalModalityUses}
                config={MODALITY_CONFIG[mod]}
              />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Active Jobs</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-sm text-slate-700">
                  {OVERVIEW_STATS.activeJobs} jobs running
                </span>
              </div>
              <button
                onClick={() => onNavigate('pipeline')}
                className="text-xs text-teal-600 font-medium hover:underline"
              >
                Monitor →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Sessions</h2>
          <button
            onClick={() => onNavigate('datasets')}
            className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
          >
            All datasets <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Session ID','Subject','Paradigm','Modalities','Duration','QC'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentSessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.id}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{s.subject}</td>
                  <td className="px-5 py-3 text-slate-600">{s.paradigm}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.modalities.map(m => (
                        <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${MODALITY_CONFIG[m].bg} ${MODALITY_CONFIG[m].text}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{s.duration}</td>
                  <td className="px-5 py-3">
                    <QCBadge status={s.qcStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QCBadge({ status }) {
  const map = {
    pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    fail: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}
