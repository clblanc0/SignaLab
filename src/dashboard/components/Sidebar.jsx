import React from 'react';
import { Settings, User } from 'lucide-react';
import { NAV_ITEMS } from '../appConfig';

const SignalLogo = () => (
  <svg viewBox="0 0 58 34" className="w-10 h-6" fill="none" aria-hidden="true">
    <path
      d="M29 1.8 52.6 15.4v3.2L29 32.2 5.4 18.6v-3.2L29 1.8Z"
      fill="#101827"
      stroke="#2E3A4F"
      strokeWidth="1.4"
    />
    <polyline
      points="7,17 12,17 14,12 17,23 20,14 23,20 26,17"
      stroke="#8A94A6"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.75"
    />
    <polyline
      points="13,17 18,17 20,8 24,25 28,12 32,22 36,17"
      stroke="#7C3AED"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="27,17 33,17 36,10 40,23 44,15 47,19 51,17"
      stroke="#14D8C8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Sidebar({ currentView, metrics = {}, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-brand-ink flex flex-col z-40 shadow-2xl shadow-brand-black/20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <SignalLogo />
          <span className="text-white font-bold text-lg tracking-tight">
            Signa<span className="text-brand-teal">Lab</span>
          </span>
        </div>
        <p className="text-brand-gray text-[10px] mt-1 leading-tight font-semibold tracking-[0.16em] uppercase">
          Multi-modal neurodata platform
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
          const active = currentView === id;
          const badgeValue = badge ? metrics[badge] : null;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-teal/15 text-brand-teal border border-brand-teal/25 shadow-glowTeal'
                  : 'text-brand-gray hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={active ? 'text-brand-teal' : ''} />
              {label}
              {badgeValue > 0 && (
                <span className="ml-auto bg-brand-violet text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-glowViolet">
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-gray hover:text-slate-100 hover:bg-white/5 transition-colors">
          <Settings size={16} />
          Settings
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 rounded-full bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-brand-teal" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-300 text-xs font-semibold truncate">CLB Lab</p>
            <p className="text-brand-gray text-[10px] truncate">UAB Neuroengineering</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
