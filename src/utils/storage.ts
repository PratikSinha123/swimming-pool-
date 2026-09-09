import type { PoolEntry, PoolSettings } from '../types';

export const SETTINGS_KEY = 'hostel_pool_settings_v5';
export const ENTRIES_KEY = 'hostel_pool_entries_v5';

export const DEFAULT_SETTINGS: PoolSettings = {
  poolName: 'Hostel Swimming Pool',
  hostelName: 'Hostel Campus',
  openTime: '06:00', // 6:00 AM
  closeTime: '17:30', // 5:30 PM
  isOpenManually: true,
  wardenPin: 'Ramesh1234',
  googleSheetsWebhookUrl: '',
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
};

export function getStoredSettings(): PoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to parse settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: PoolSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pool_settings_updated'));
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredEntries(): PoolEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load entries:', err);
    return [];
  }
}

export function saveStoredEntries(entries: PoolEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pool_entries_updated'));
    }
  } catch (err) {
    console.error('Failed to save entries:', err);
  }
}
