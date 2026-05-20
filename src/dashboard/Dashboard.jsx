import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { DEFAULT_VIEW, VIEW_COMPONENTS } from './appConfig';
import { PIPELINE_JOBS } from './mockData';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState(DEFAULT_VIEW);
  const View = VIEW_COMPONENTS[currentView] ?? VIEW_COMPONENTS[DEFAULT_VIEW];
  const activeJobCount = PIPELINE_JOBS.filter(job => job.status === 'running').length;

  return (
    <div className="min-h-screen signalab-surface font-sans text-brand-ink">
      <Sidebar
        currentView={currentView}
        metrics={{ activeJobs: activeJobCount }}
        onNavigate={setCurrentView}
      />
      <main className="ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <View onNavigate={setCurrentView} />
        </div>
      </main>
    </div>
  );
}
