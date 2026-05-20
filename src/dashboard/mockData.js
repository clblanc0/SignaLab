// ─── EEG Channel Map (10-20 system, 64ch) ────────────────────────────────────
export const EEG_CHANNELS_64 = [
  'Fp1','AF7','AF3','F1', 'F3', 'F5', 'F7', 'FT7',
  'FC5','FC3','FC1','C1', 'C3', 'C5', 'T7', 'TP7',
  'CP5','CP3','CP1','P1', 'P3', 'P5', 'P7', 'P9',
  'PO7','PO3','O1', 'Iz', 'Oz', 'POz','Pz', 'CPz',
  'Fpz','Fp2','AF8','AF4','AFz','Fz', 'F2', 'F4',
  'F6', 'F8', 'FT8','FC6','FC4','FC2','FCz','Cz',
  'C2', 'C4', 'C6', 'T8', 'TP8','CP6','CP4','CP2',
  'P2', 'P4', 'P6', 'P8', 'P10','PO8','PO4','O2',
];

// ─── Modality Config ──────────────────────────────────────────────────────────
export const MODALITY_CONFIG = {
  EEG:   { color: 'teal',   bg: 'bg-brand-teal/15',   text: 'text-brand-tealDark',   dot: 'bg-brand-teal'   },
  EMG:   { color: 'violet', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  ECG:   { color: 'rose',   bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-500'   },
  BEH:   { color: 'violet', bg: 'bg-brand-violet/10', text: 'text-brand-violetDark', dot: 'bg-brand-violet' },
  fNIRS: { color: 'amber',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  fMRI:  { color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  sMRI:  { color: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  MEG:   { color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

// ─── Device Formats ───────────────────────────────────────────────────────────
export const DEVICE_FORMATS = [
  { id: 'brainvision', label: 'BrainVision (.vhdr)',      exts: ['.vhdr', '.vmrk', '.eeg'] },
  { id: 'bdf',         label: 'BDF — BioSemi (.bdf)',     exts: ['.bdf']                   },
  { id: 'edf',         label: 'EDF / EDF+ (.edf)',        exts: ['.edf']                   },
  { id: 'mff',         label: 'EGI MFF (.mff)',            exts: ['.mff']                   },
  { id: 'hdf5',        label: 'HDF5 (.h5 / .hdf5)',       exts: ['.h5', '.hdf5']           },
  { id: 'csv',         label: 'CSV / OpenBCI (.csv)',      exts: ['.csv', '.txt']           },
  { id: 'timeseries',  label: 'Time-series CSV/JSON',      exts: ['.csv', '.tsv', '.json']  },
  { id: 'nifti',       label: 'NIfTI (.nii / .nii.gz)',   exts: ['.nii', '.nii.gz']        },
  { id: 'dicom',       label: 'DICOM (.dcm)',              exts: ['.dcm']                   },
  { id: 'bids',        label: 'BIDS Directory',            exts: ['.json']                  },
  { id: 'fif',         label: 'MEG FIF (.fif)',            exts: ['.fif']                   },
];

// ─── Overview Stats ───────────────────────────────────────────────────────────
export const OVERVIEW_STATS = {
  totalSessions:      847,
  processedToday:      12,
  qcPassRate:        91.4,
  avgProcessingTime:  4.2,
  totalGBProcessed: 128.7,
  activeJobs:           3,
  subjectsEnrolled:    89,
  outputDatasets:     731,
};

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const SESSIONS = [
  {
    id: 'SL-2025-0495', subject: 'SUB-047',
    modalities: ['fMRI','sMRI'], device: 'Siemens Prisma 3T',
    format: 'BIDS / NIfTI', imaging: { matrix: '91×109×91', tr: '1.0 s', te: '28 ms', volumes: 300, resolution: '2 mm iso' },
    duration: '58:00', fileSize: '4.82 GB',
    date: '2025-04-30T13:10:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'Resting-State fMRI', processingTime: 18.4,
  },
  {
    id: 'SL-2025-0494', subject: 'SUB-046',
    modalities: ['fMRI','EEG'], device: 'Siemens Prisma 3T + BrainProducts MR-compatible',
    format: 'BIDS / NIfTI + BrainVision', imaging: { matrix: '91×109×91', tr: '2.0 s', te: '30 ms', volumes: 225, resolution: '2 mm iso' },
    duration: '45:00', fileSize: '6.14 GB',
    date: '2025-04-29T10:30:00Z', status: 'complete',
    qcStatus: 'warn', paradigm: 'Simultaneous EEG-fMRI', processingTime: 22.7,
  },
  {
    id: 'SL-2025-0493', subject: 'SUB-045',
    modalities: ['sMRI'], device: 'Siemens Magnetom Terra 7T',
    format: 'DICOM → NIfTI', imaging: { matrix: '256×256×192', tr: '2300 ms', te: '2.98 ms', volumes: 1, resolution: '0.7 mm iso' },
    duration: '12:00', fileSize: '1.28 GB',
    date: '2025-04-28T09:00:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'T1w Structural MRI', processingTime: 8.2,
  },
  {
    id: 'SL-2025-0489', subject: 'SUB-041',
    modalities: ['EEG','ECG'], device: 'BrainProducts actiCHamp Plus',
    format: 'BrainVision', channels: { EEG: 64, ECG: 1 },
    duration: '45:12', fileSize: '2.14 GB',
    date: '2025-04-30T14:23:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'Resting State', processingTime: 3.8,
  },
  {
    id: 'SL-2025-0488', subject: 'SUB-040',
    modalities: ['EEG','EMG','ECG'], device: 'BioSemi ActiveTwo',
    format: 'BDF', channels: { EEG: 32, EMG: 8, ECG: 1 },
    duration: '62:44', fileSize: '3.87 GB',
    date: '2025-04-30T11:05:00Z', status: 'complete',
    qcStatus: 'warn', paradigm: 'Motor Imagery BCI', processingTime: 5.1,
  },
  {
    id: 'SL-2025-0487', subject: 'SUB-039',
    modalities: ['EEG'], device: 'ANT Neuro eego sports',
    format: 'EDF', channels: { EEG: 64 },
    duration: '30:00', fileSize: '1.62 GB',
    date: '2025-04-29T16:47:00Z', status: 'complete',
    qcStatus: 'fail', paradigm: 'N-Back Working Memory', processingTime: 3.2,
  },
  {
    id: 'SL-2025-0486', subject: 'SUB-038',
    modalities: ['EEG','ECG'], device: 'BrainProducts actiCHamp Plus',
    format: 'BrainVision', channels: { EEG: 64, ECG: 1 },
    duration: '50:00', fileSize: '2.41 GB',
    date: '2025-04-29T09:22:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'taVNS Neuromodulation', processingTime: 4.0,
  },
  {
    id: 'SL-2025-0485', subject: 'SUB-037',
    modalities: ['EEG','EMG','BEH'], device: 'OpenBCI Cyton+Daisy + behavioral task stream',
    format: 'CSV + behavioral time-series', channels: { EEG: 16, EMG: 4, BEH: 12 },
    duration: '28:33', fileSize: '0.93 GB',
    date: '2025-04-28T13:10:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'Driving Simulation', processingTime: 2.9,
  },
  {
    id: 'SL-2025-0484', subject: 'SUB-036',
    modalities: ['fNIRS','ECG'], device: 'fNIRSport2',
    format: 'HDF5', channels: { fNIRS: 20, ECG: 1 },
    duration: '40:00', fileSize: '0.38 GB',
    date: '2025-04-28T10:00:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'Cognitive Load', processingTime: 1.7,
  },
  {
    id: 'SL-2025-0483', subject: 'SUB-035',
    modalities: ['EEG'], device: 'BioSemi ActiveTwo',
    format: 'BDF', channels: { EEG: 32 },
    duration: '35:20', fileSize: '1.44 GB',
    date: '2025-04-27T15:30:00Z', status: 'complete',
    qcStatus: 'warn', paradigm: 'Emotional Faces Oddball', processingTime: 3.4,
  },
  {
    id: 'SL-2025-0482', subject: 'SUB-034',
    modalities: ['EEG','ECG'], device: 'Muse 2',
    format: 'CSV', channels: { EEG: 4, ECG: 1 },
    duration: '20:00', fileSize: '0.11 GB',
    date: '2025-04-27T09:45:00Z', status: 'complete',
    qcStatus: 'pass', paradigm: 'Resting State', processingTime: 1.1,
  },
];

// ─── Pipeline Jobs ────────────────────────────────────────────────────────────
export const PIPELINE_JOBS = [
  {
    id: 'JOB-1042', sessionId: 'SL-2025-0490', subject: 'SUB-042',
    modalities: ['EEG','ECG'], format: 'BrainVision',
    status: 'running', progress: 62,
    startedAt: '2025-04-30T15:01:00Z',
    stages: [
      { name: 'Ingestion',         status: 'done',    duration: 0.4 },
      { name: 'Format Parsing',    status: 'done',    duration: 0.9 },
      { name: 'Channel Validation',status: 'done',    duration: 0.3 },
      { name: 'Artifact Detection',status: 'running', duration: null },
      { name: 'Epoching',          status: 'pending', duration: null },
      { name: 'Standardization',   status: 'pending', duration: null },
      { name: 'NWB Export',        status: 'pending', duration: null },
    ],
  },
  {
    id: 'JOB-1044', sessionId: 'SL-2025-0496', subject: 'SUB-048',
    modalities: ['fMRI','sMRI'], format: 'BIDS / NIfTI',
    status: 'running', progress: 41,
    startedAt: '2025-04-30T15:10:00Z',
    stages: [
      { name: 'Ingestion',          status: 'done',    duration: 1.2 },
      { name: 'DICOM → NIfTI',      status: 'done',    duration: 4.8 },
      { name: 'BIDS Validation',    status: 'done',    duration: 0.6 },
      { name: 'Motion Correction',  status: 'running', duration: null },
      { name: 'Brain Extraction',   status: 'pending', duration: null },
      { name: 'Normalization',      status: 'pending', duration: null },
      { name: 'NWB Export',         status: 'pending', duration: null },
    ],
  },
  {
    id: 'JOB-1041', sessionId: 'SL-2025-0491', subject: 'SUB-043',
    modalities: ['EEG','EMG'], format: 'BDF',
    status: 'running', progress: 28,
    startedAt: '2025-04-30T15:04:00Z',
    stages: [
      { name: 'Ingestion',         status: 'done',    duration: 0.5 },
      { name: 'Format Parsing',    status: 'done',    duration: 1.1 },
      { name: 'Channel Validation',status: 'running', duration: null },
      { name: 'Artifact Detection',status: 'pending', duration: null },
      { name: 'Epoching',          status: 'pending', duration: null },
      { name: 'Standardization',   status: 'pending', duration: null },
      { name: 'NWB Export',        status: 'pending', duration: null },
    ],
  },
  {
    id: 'JOB-1040', sessionId: 'SL-2025-0492', subject: 'SUB-044',
    modalities: ['fNIRS'], format: 'HDF5',
    status: 'queued', progress: 0,
    startedAt: null,
    stages: [
      { name: 'Ingestion',         status: 'pending', duration: null },
      { name: 'Format Parsing',    status: 'pending', duration: null },
      { name: 'Channel Validation',status: 'pending', duration: null },
      { name: 'Artifact Detection',status: 'pending', duration: null },
      { name: 'Epoching',          status: 'pending', duration: null },
      { name: 'Standardization',   status: 'pending', duration: null },
      { name: 'NWB Export',        status: 'pending', duration: null },
    ],
  },
  {
    id: 'JOB-1039', sessionId: 'SL-2025-0489', subject: 'SUB-041',
    modalities: ['EEG','ECG'], format: 'BrainVision',
    status: 'complete', progress: 100,
    startedAt: '2025-04-30T14:23:10Z', completedAt: '2025-04-30T14:23:14Z',
    stages: [
      { name: 'Ingestion',         status: 'done', duration: 0.4 },
      { name: 'Format Parsing',    status: 'done', duration: 0.8 },
      { name: 'Channel Validation',status: 'done', duration: 0.3 },
      { name: 'Artifact Detection',status: 'done', duration: 1.2 },
      { name: 'Epoching',          status: 'done', duration: 0.6 },
      { name: 'Standardization',   status: 'done', duration: 0.3 },
      { name: 'NWB Export',        status: 'done', duration: 0.2 },
    ],
  },
  {
    id: 'JOB-1043', sessionId: 'SL-2025-0495', subject: 'SUB-047',
    modalities: ['fMRI','sMRI'], format: 'BIDS / NIfTI',
    status: 'complete', progress: 100,
    startedAt: '2025-04-30T13:10:05Z', completedAt: '2025-04-30T13:10:23Z',
    stages: [
      { name: 'Ingestion',         status: 'done', duration: 1.1 },
      { name: 'DICOM → NIfTI',     status: 'done', duration: 5.2 },
      { name: 'BIDS Validation',   status: 'done', duration: 0.8 },
      { name: 'Motion Correction', status: 'done', duration: 4.3 },
      { name: 'Brain Extraction',  status: 'done', duration: 3.1 },
      { name: 'Normalization',     status: 'done', duration: 2.9 },
      { name: 'NWB Export',        status: 'done', duration: 1.0 },
    ],
  },
  {
    id: 'JOB-1038', sessionId: 'SL-2025-0488', subject: 'SUB-040',
    modalities: ['EEG','EMG','ECG'], format: 'BDF',
    status: 'complete', progress: 100,
    startedAt: '2025-04-30T11:05:05Z', completedAt: '2025-04-30T11:05:10Z',
    stages: [
      { name: 'Ingestion',         status: 'done', duration: 0.6 },
      { name: 'Format Parsing',    status: 'done', duration: 1.3 },
      { name: 'Channel Validation',status: 'done', duration: 0.5 },
      { name: 'Artifact Detection',status: 'warn', duration: 1.8 },
      { name: 'Epoching',          status: 'done', duration: 0.5 },
      { name: 'Standardization',   status: 'done', duration: 0.2 },
      { name: 'NWB Export',        status: 'done', duration: 0.2 },
    ],
  },
  {
    id: 'JOB-1036', sessionId: 'SL-2025-0485', subject: 'SUB-037',
    modalities: ['EEG','EMG','BEH'], format: 'CSV + behavioral time-series',
    status: 'complete', progress: 100,
    startedAt: '2025-04-28T13:10:02Z', completedAt: '2025-04-28T13:10:09Z',
    stages: [
      { name: 'Ingestion',         status: 'done', duration: 0.4 },
      { name: 'Format Parsing',    status: 'done', duration: 0.6 },
      { name: 'Channel Validation',status: 'done', duration: 0.3 },
      { name: 'Clock Drift Fit',   status: 'done', duration: 1.1 },
      { name: 'Event Sync',        status: 'done', duration: 0.8 },
      { name: 'Epoching',          status: 'done', duration: 0.5 },
      { name: 'NWB Export',        status: 'done', duration: 0.3 },
    ],
  },
  {
    id: 'JOB-1037', sessionId: 'SL-2025-0487', subject: 'SUB-039',
    modalities: ['EEG'], format: 'EDF',
    status: 'failed', progress: 43,
    startedAt: '2025-04-29T16:47:02Z', completedAt: '2025-04-29T16:47:05Z',
    error: 'Channel validation failed: 18 / 64 channels exceeded impedance threshold (>25 kΩ). Recording unusable.',
    stages: [
      { name: 'Ingestion',         status: 'done',   duration: 0.3 },
      { name: 'Format Parsing',    status: 'done',   duration: 0.8 },
      { name: 'Channel Validation',status: 'failed', duration: 1.1 },
      { name: 'Artifact Detection',status: 'skip',   duration: null },
      { name: 'Epoching',          status: 'skip',   duration: null },
      { name: 'Standardization',   status: 'skip',   duration: null },
      { name: 'NWB Export',        status: 'skip',   duration: null },
    ],
  },
];

// ─── Datasets ─────────────────────────────────────────────────────────────────
export const DATASETS = [
  {
    id: 'DS-2025-0495', sessionId: 'SL-2025-0495', subject: 'SUB-047',
    name: 'sub-047_task-rest_fmri-smri', modalities: ['fMRI','sMRI'],
    outputFormat: 'NWB 2.7 + BIDS', fileSize: '1.24 GB', qcStatus: 'pass',
    channels: 'N/A', samplingRate: 'TR 1.0 s', paradigm: 'Resting-State fMRI',
    createdAt: '2025-04-30T13:10:23Z', doi: null, tags: ['fmri','resting-state','fc'],
  },
  {
    id: 'DS-2025-0494', sessionId: 'SL-2025-0494', subject: 'SUB-046',
    name: 'sub-046_task-rest_eeg-fmri', modalities: ['fMRI','EEG'],
    outputFormat: 'NWB 2.7 + BIDS', fileSize: '2.08 GB', qcStatus: 'warn',
    channels: 64, samplingRate: 'TR 2.0 s / 5000 Hz', paradigm: 'Simultaneous EEG-fMRI',
    createdAt: '2025-04-29T10:30:45Z', doi: null, tags: ['eeg-fmri','simultaneous','neurovascular'],
  },
  {
    id: 'DS-2025-0493', sessionId: 'SL-2025-0493', subject: 'SUB-045',
    name: 'sub-045_T1w_7T', modalities: ['sMRI'],
    outputFormat: 'NWB 2.7 + BIDS', fileSize: '412 MB', qcStatus: 'pass',
    channels: 'N/A', samplingRate: '0.7 mm iso', paradigm: 'T1w Structural MRI',
    createdAt: '2025-04-28T09:00:08Z', doi: null, tags: ['smri','7T','anatomy'],
  },
  {
    id: 'DS-2025-0489', sessionId: 'SL-2025-0489', subject: 'SUB-041',
    name: 'sub-041_task-rest_multimodal', modalities: ['EEG','ECG'],
    outputFormat: 'NWB 2.7', fileSize: '318 MB', qcStatus: 'pass',
    channels: 65, samplingRate: '1000 Hz', paradigm: 'Resting State',
    createdAt: '2025-04-30T14:23:14Z', doi: null, tags: ['rest','taVNS-baseline'],
  },
  {
    id: 'DS-2025-0488', sessionId: 'SL-2025-0488', subject: 'SUB-040',
    name: 'sub-040_task-motorimagery_eeg-emg-ecg', modalities: ['EEG','EMG','ECG'],
    outputFormat: 'NWB 2.7', fileSize: '541 MB', qcStatus: 'warn',
    channels: 41, samplingRate: '2048 Hz', paradigm: 'Motor Imagery BCI',
    createdAt: '2025-04-30T11:05:10Z', doi: null, tags: ['bci','motor'],
  },
  {
    id: 'DS-2025-0486', sessionId: 'SL-2025-0486', subject: 'SUB-038',
    name: 'sub-038_task-tavns_eeg-ecg', modalities: ['EEG','ECG'],
    outputFormat: 'NWB 2.7', fileSize: '402 MB', qcStatus: 'pass',
    channels: 65, samplingRate: '1000 Hz', paradigm: 'taVNS Neuromodulation',
    createdAt: '2025-04-29T09:22:08Z', doi: null, tags: ['taVNS','neuromodulation'],
  },
  {
    id: 'DS-2025-0485', sessionId: 'SL-2025-0485', subject: 'SUB-037',
    name: 'sub-037_task-driving_eeg-emg-beh', modalities: ['EEG','EMG','BEH'],
    outputFormat: 'NWB 2.7', fileSize: '214 MB', qcStatus: 'pass',
    channels: 32, samplingRate: '250 Hz / 60 Hz', paradigm: 'Driving Simulation',
    createdAt: '2025-04-28T13:10:05Z', doi: null, tags: ['driving','adhd','synced-timeseries'],
  },
  {
    id: 'DS-2025-0484', sessionId: 'SL-2025-0484', subject: 'SUB-036',
    name: 'sub-036_task-cogload_fnirs-ecg', modalities: ['fNIRS','ECG'],
    outputFormat: 'NWB 2.7', fileSize: '67 MB', qcStatus: 'pass',
    channels: 21, samplingRate: '10 Hz / 1000 Hz', paradigm: 'Cognitive Load',
    createdAt: '2025-04-28T10:00:03Z', doi: null, tags: ['fnirs','cognitive'],
  },
  {
    id: 'DS-2025-0483', sessionId: 'SL-2025-0483', subject: 'SUB-035',
    name: 'sub-035_task-oddball_eeg', modalities: ['EEG'],
    outputFormat: 'NWB 2.7', fileSize: '233 MB', qcStatus: 'warn',
    channels: 32, samplingRate: '2048 Hz', paradigm: 'Emotional Faces Oddball',
    createdAt: '2025-04-27T15:30:07Z', doi: null, tags: ['oddball','erp'],
  },
  {
    id: 'DS-2025-0482', sessionId: 'SL-2025-0482', subject: 'SUB-034',
    name: 'sub-034_task-rest_muse-ecg', modalities: ['EEG','ECG'],
    outputFormat: 'NWB 2.7', fileSize: '22 MB', qcStatus: 'pass',
    channels: 5, samplingRate: '256 Hz', paradigm: 'Resting State',
    createdAt: '2025-04-27T09:45:02Z', doi: null, tags: ['wearable','rest'],
  },
];

// ─── QC Reports — EEG helpers ─────────────────────────────────────────────────
const genImpedance = (seed, badChIdx = []) => {
  const result = {};
  EEG_CHANNELS_64.forEach((ch, i) => {
    const isFrontal = i < 8 || (i >= 32 && i < 40);
    const base = isFrontal ? 6 : 3;
    const pseudo = Math.abs(Math.sin(i * seed * 2.71 + seed)) * 20 + base;
    result[ch] = badChIdx.includes(i) ? 28 + Math.abs(Math.sin(i)) * 15 : Math.min(pseudo, 12);
  });
  return result;
};

// ─── fMRI: Functional Connectivity Matrix (10 RSNs, Schaefer-100 parcellation)
export const FC_REGIONS = ['DMN', 'SAL', 'FPN', 'VIS', 'SMN', 'DAN', 'LIM', 'CON', 'TMP', 'SUB'];
export const FC_REGION_LABELS = {
  DMN: 'Default Mode',     SAL: 'Salience',
  FPN: 'Frontoparietal',   VIS: 'Visual',
  SMN: 'Somatomotor',      DAN: 'Dorsal Attention',
  LIM: 'Limbic',           CON: 'Cingulo-Opercular',
  TMP: 'Temporal',         SUB: 'Subcortical',
};

// Realistic RSN correlation matrix — DMN anti-correlates with task-positive nets
export const FC_MATRIX_PASS = [
//  DMN    SAL    FPN    VIS    SMN    DAN    LIM    CON    TMP    SUB
  [ 1.00, -0.18,  0.22, -0.08, -0.22, -0.31,  0.15,  0.18,  0.28,  0.05], // DMN
  [-0.18,  1.00,  0.38,  0.12,  0.25,  0.35,  0.20,  0.42,  0.15,  0.18], // SAL
  [ 0.22,  0.38,  1.00,  0.05,  0.10,  0.45,  0.08,  0.55,  0.20,  0.12], // FPN
  [-0.08,  0.12,  0.05,  1.00,  0.35,  0.28, -0.05,  0.08,  0.15,  0.02], // VIS
  [-0.22,  0.25,  0.10,  0.35,  1.00,  0.30,  0.05,  0.15,  0.08,  0.10], // SMN
  [-0.31,  0.35,  0.45,  0.28,  0.30,  1.00,  0.05,  0.38,  0.12,  0.08], // DAN
  [ 0.15,  0.20,  0.08, -0.05,  0.05,  0.05,  1.00,  0.12,  0.22,  0.18], // LIM
  [ 0.18,  0.42,  0.55,  0.08,  0.15,  0.38,  0.12,  1.00,  0.18,  0.15], // CON
  [ 0.28,  0.15,  0.20,  0.15,  0.08,  0.12,  0.22,  0.18,  1.00,  0.08], // TMP
  [ 0.05,  0.18,  0.12,  0.02,  0.10,  0.08,  0.18,  0.15,  0.08,  1.00], // SUB
];

// Warn session: noisier matrix, weaker DMN anti-correlation (high motion artifact)
export const FC_MATRIX_WARN = [
  [ 1.00, -0.08,  0.14, -0.02, -0.12, -0.18,  0.10,  0.09,  0.18,  0.04],
  [-0.08,  1.00,  0.22,  0.08,  0.18,  0.24,  0.14,  0.28,  0.10,  0.12],
  [ 0.14,  0.22,  1.00,  0.04,  0.06,  0.30,  0.05,  0.38,  0.12,  0.08],
  [-0.02,  0.08,  0.04,  1.00,  0.22,  0.18, -0.03,  0.05,  0.10,  0.01],
  [-0.12,  0.18,  0.06,  0.22,  1.00,  0.20,  0.04,  0.10,  0.05,  0.07],
  [-0.18,  0.24,  0.30,  0.18,  0.20,  1.00,  0.03,  0.25,  0.08,  0.05],
  [ 0.10,  0.14,  0.05, -0.03,  0.04,  0.03,  1.00,  0.08,  0.15,  0.12],
  [ 0.09,  0.28,  0.38,  0.05,  0.10,  0.25,  0.08,  1.00,  0.12,  0.10],
  [ 0.18,  0.10,  0.12,  0.10,  0.05,  0.08,  0.15,  0.12,  1.00,  0.05],
  [ 0.04,  0.12,  0.08,  0.01,  0.07,  0.05,  0.12,  0.10,  0.05,  1.00],
];

// ─── fMRI: Framewise Displacement generator (deterministic, realistic)
export const genFD = (n = 300, seed = 1) => {
  const vals = [];
  let v = 0.12;
  for (let i = 0; i < n; i++) {
    const drift  = Math.sin(i * 0.08 * seed) * 0.04;
    const noise  = (Math.sin(i * 17.3 + seed * 2) + Math.sin(i * 11.1 + seed)) * 0.04;
    v = Math.max(0.02, v + drift + noise);
    // sporadic motion spikes
    if (Math.sin(i * 41.7 + seed * 13) > 0.94) v = Math.min(v + 0.55 + Math.abs(Math.sin(i)) * 0.3, 1.8);
    else v = Math.min(v, 0.45);
    vals.push(parseFloat(v.toFixed(3)));
  }
  return vals;
};

// ─── QC Reports ───────────────────────────────────────────────────────────────
export const QC_REPORTS = {
  // ── fMRI sessions ───────────────────────────────────────────────────────────
  'SL-2025-0495': {
    overallStatus: 'pass',
    fMRI: {
      status: 'pass',
      tSNR: 72.4,
      meanFD: 0.14,
      maxFD: 0.68,
      scrubbedVolumes: 2,
      totalVolumes: 300,
      dvars: 1.18,
      boldCoverage: 99.1,
      ghostingRatio: 0.012,
      parcellation: 'Schaefer-100 (10 RSNs)',
      fdSeed: 1,
      fcMatrix: FC_MATRIX_PASS,
    },
    sMRI: {
      status: 'pass',
      cnr: 3.42,
      snr: 18.7,
      warpQuality: 'excellent',
      corticalThickness: '2.41 mm (mean)',
      wmVolume: '461 cm³',
      gmVolume: '682 cm³',
      eulerNumber: -4,
    },
  },
  'SL-2025-0494': {
    overallStatus: 'warn',
    fMRI: {
      status: 'warn',
      tSNR: 48.2,
      meanFD: 0.31,
      maxFD: 1.24,
      scrubbedVolumes: 18,
      totalVolumes: 225,
      dvars: 1.87,
      boldCoverage: 97.3,
      ghostingRatio: 0.028,
      parcellation: 'Schaefer-100 (10 RSNs)',
      fdSeed: 2,
      fcMatrix: FC_MATRIX_WARN,
      note: 'Gradient artifact removed from simultaneous EEG recording. Elevated motion; 18 volumes scrubbed.',
    },
    EEG: {
      status: 'pass',
      badChannels: ['Fp1','AF7'],
      impedance: genImpedance(1.8, [0, 1]),
      artifactRate: 11.3,
      epochRejectionRate: 14.2,
      snr: 21.8,
      lineNoise: 38.4,
      bandPower: { delta: 30, theta: 20, alpha: 26, beta: 19, gamma: 5 },
      note: 'MR gradient artifact successfully suppressed via AAS. BCG artifact removed.',
    },
  },
  'SL-2025-0493': {
    overallStatus: 'pass',
    sMRI: {
      status: 'pass',
      cnr: 4.81,
      snr: 24.3,
      warpQuality: 'excellent',
      corticalThickness: '2.38 mm (mean)',
      wmVolume: '458 cm³',
      gmVolume: '678 cm³',
      eulerNumber: -2,
      resolution: '0.7 mm isotropic',
      scanner: 'Siemens Magnetom Terra 7T',
    },
  },

  // ── EEG / biosignal sessions ─────────────────────────────────────────────────
  'SL-2025-0489': {
    overallStatus: 'pass',
    EEG: {
      status: 'pass',
      badChannels: ['P9', 'P10'],
      impedance: genImpedance(1.3, [23, 61]),
      artifactRate: 7.2,
      epochRejectionRate: 9.8,
      snr: 26.4,
      lineNoise: 48.2,
      bandPower: { delta: 32, theta: 18, alpha: 28, beta: 17, gamma: 5 },
    },
    ECG: {
      status: 'pass',
      heartRate: 64.3,
      hrv_sdnn: 58.7,
      hrv_rmssd: 44.2,
      signalQualityIndex: 0.97,
    },
  },
  'SL-2025-0488': {
    overallStatus: 'warn',
    EEG: {
      status: 'warn',
      badChannels: ['AF7', 'FT7', 'TP7', 'F5'],
      impedance: genImpedance(2.1, [1, 7, 15, 5]),
      artifactRate: 19.4,
      epochRejectionRate: 22.1,
      snr: 17.8,
      lineNoise: 31.5,
      bandPower: { delta: 28, theta: 22, alpha: 19, beta: 24, gamma: 7 },
    },
    EMG: {
      status: 'pass',
      activeChannels: 8,
      rmsNoise: 1.8,
      snr: 31.2,
      amplitudeRange: '±850 µV',
    },
    ECG: {
      status: 'pass',
      heartRate: 72.1,
      hrv_sdnn: 49.3,
      hrv_rmssd: 36.8,
      signalQualityIndex: 0.94,
    },
  },
  'SL-2025-0487': {
    overallStatus: 'fail',
    EEG: {
      status: 'fail',
      badChannels: ['Fp1','AF7','AF3','F1','F3','F5','F7','FT7','FT8','FC6','F6','F8','P9','P10','PO7','PO3','PO8','PO4'],
      impedance: genImpedance(3.7, [0,1,2,3,4,5,6,7,42,43,38,39,23,61,24,25,62,63]),
      artifactRate: 68.3,
      epochRejectionRate: 71.5,
      snr: 6.1,
      lineNoise: 12.8,
      bandPower: { delta: 55, theta: 20, alpha: 12, beta: 10, gamma: 3 },
    },
  },
};

// ─── Recent Activity Feed ─────────────────────────────────────────────────────
export const RECENT_ACTIVITY = [
  { id: 1, type: 'complete', message: 'SUB-047 resting-state fMRI + sMRI processed', time: '22m ago', sessionId: 'SL-2025-0495' },
  { id: 2, type: 'complete', message: 'SUB-041 resting-state EEG/ECG processed',     time: '37m ago', sessionId: 'SL-2025-0489' },
  { id: 3, type: 'running',  message: 'SUB-048 fMRI motion correction in progress',  time: '1h ago',  sessionId: 'SL-2025-0496' },
  { id: 4, type: 'warn',     message: 'SUB-046 EEG-fMRI — high motion (mean FD 0.31 mm)', time: '4h ago', sessionId: 'SL-2025-0494' },
  { id: 5, type: 'complete', message: 'SUB-045 T1w 7T structural scan processed',    time: '1d ago',  sessionId: 'SL-2025-0493' },
  { id: 6, type: 'warn',     message: 'SUB-040 motor imagery — high artifact rate (19.4%)', time: '4h ago', sessionId: 'SL-2025-0488' },
  { id: 7, type: 'fail',     message: 'SUB-039 N-back failed QC — 18 bad channels', time: '19h ago', sessionId: 'SL-2025-0487' },
  { id: 8, type: 'complete', message: 'SUB-037 behavioral time-series synchronized with EEG/EMG streams', time: '2d ago', sessionId: 'SL-2025-0485' },
];
