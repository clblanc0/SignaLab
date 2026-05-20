import { DEVICE_FORMATS } from './mockData';

export function countModalities(sessions) {
  return sessions.reduce((counts, session) => {
    session.modalities.forEach((modality) => {
      counts[modality] = (counts[modality] ?? 0) + 1;
    });
    return counts;
  }, {});
}

export function countByStatus(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, { all: items.length });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(iso, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  const hours = Math.floor(diff / 3.6e6);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatElapsedTime(startedAt, now = Date.now()) {
  if (!startedAt) return null;
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function fileSizeToMB(fileSize) {
  const value = parseFloat(fileSize);
  if (Number.isNaN(value)) return 0;
  return fileSize.toUpperCase().includes('GB') ? value * 1024 : value;
}

export function detectRecordingFormat(filename) {
  const lower = filename.toLowerCase();
  const match = DEVICE_FORMATS.find((format) => (
    format.exts.some((ext) => lower.endsWith(ext))
  ));
  return match?.id ?? null;
}

export function detectRecordingModality(filename) {
  const lower = filename.toLowerCase();
  if (
    lower.includes('beh') ||
    lower.includes('behavior') ||
    lower.includes('behaviour') ||
    lower.includes('task') ||
    lower.includes('event') ||
    lower.includes('marker') ||
    lower.includes('response') ||
    lower.includes('reaction') ||
    lower.includes('rt') ||
    lower.includes('kinematic') ||
    lower.includes('motion') ||
    lower.includes('gait') ||
    lower.includes('force') ||
    lower.includes('eye') ||
    lower.includes('pupil') ||
    lower.includes('drive') ||
    lower.includes('sim') ||
    lower.includes('telemetry') ||
    lower.includes('steering') ||
    lower.includes('lane') ||
    lower.includes('vehicle')
  ) return 'BEH';
  if (lower.includes('emg') || lower.includes('muscle')) return 'EMG';
  if (lower.includes('ecg') || lower.includes('heart') || lower.includes('cardiac')) return 'ECG';
  if (lower.includes('fnirs') || lower.includes('nirs')) return 'fNIRS';
  return 'EEG';
}
