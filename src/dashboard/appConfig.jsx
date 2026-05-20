import { Activity, BarChart2, Database, Layers, LineChart, Upload } from 'lucide-react';
import Datasets from './views/Datasets';
import Ingest from './views/Ingest';
import Overview from './views/Overview';
import Pipeline from './views/Pipeline';
import QCReports from './views/QCReports';
import Visualizer from './views/Visualizer';

export const DEFAULT_VIEW = 'overview';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'ingest', label: 'Ingest', icon: Upload },
  { id: 'pipeline', label: 'Pipeline', icon: Layers, badge: 'activeJobs' },
  { id: 'qc', label: 'QC Reports', icon: Activity },
  { id: 'visualizer', label: 'Signal Viewer', icon: LineChart },
  { id: 'datasets', label: 'Datasets', icon: Database },
];

export const VIEW_COMPONENTS = {
  overview: Overview,
  ingest: Ingest,
  pipeline: Pipeline,
  qc: QCReports,
  visualizer: Visualizer,
  datasets: Datasets,
};

