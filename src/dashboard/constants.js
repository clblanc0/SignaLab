export const INGEST_MODALITIES = ['EEG', 'EMG', 'ECG', 'fNIRS', 'BEH'];

export const DATASET_FILTER_MODALITIES = ['EEG', 'EMG', 'ECG', 'fNIRS', 'BEH'];

export const VIEWABLE_MODALITIES = new Set(['EEG', 'fMRI', 'ECG', 'EMG']);

export const PIPELINE_STATUS_FILTERS = ['all', 'running', 'queued', 'complete', 'failed'];

export const PARADIGMS = [
  'Resting State',
  'N-Back Working Memory',
  'Motor Imagery BCI',
  'taVNS Neuromodulation',
  'Driving Simulation',
  'Cognitive Load',
  'Emotional Faces Oddball',
  'Pain Threshold',
  'Sleep Staging',
  'Custom',
];

export const PIPELINE_TAGS = {
  EEG: ['Common Avg Reference', '1-40 Hz Bandpass', 'ICA artifact removal', 'Epoched 0.8 s', 'NWB 2.7'],
  fMRI: ['Slice timing corr.', 'Motion correction', 'MNI152 normalization', '6 mm smoothing', 'Z-scored', 'NWB 2.7'],
  ECG: ['Pan-Tompkins R-peak', 'Ectopic removal', 'HRV extracted', 'NWB 2.7'],
  EMG: ['60 Hz notch filter', '20-450 Hz Bandpass', 'RMS envelope', 'Epoched 1.0 s', 'NWB 2.7'],
  BEH: ['Clock drift fit', 'Event marker alignment', 'Resampled timeline', 'Trial epochs', 'NWB behavior module'],
};
