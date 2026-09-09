import type { PoolEntry, PoolSettings } from '../types';

const SETTINGS_KEY = 'hostel_pool_settings_v3';
const ENTRIES_KEY = 'hostel_pool_entries_v3';

export const DEFAULT_SETTINGS: PoolSettings = {
  poolName: 'Hostel Swimming Pool',
  hostelName: 'Hostel Residency',
  openTime: '06:00', // 6:00 AM
  closeTime: '17:30', // 5:30 PM
  isOpenManually: true,
  wardenPin: '1234',
  googleSheetsWebhookUrl: '',
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
};

export function getStoredSettings(): PoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to parse settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: PoolSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredEntries(): PoolEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) {
      // Seed sample records for realistic display
      const sampleEntries: PoolEntry[] = [
        {
          id: 'seed-1',
          name: 'Aarav Sharma',
          roomNumber: 'B-204',
          studentId: 'HS2023-042',
          phone: '9876543210',
          entryTimestamp: Date.now() - 45 * 60 * 1000,
          entryTimeFormatted: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          dateStr: new Date().toISOString().split('T')[0],
        },
        {
          id: 'seed-2',
          name: 'Rohan Verma',
          roomNumber: 'A-112',
          studentId: 'HS2022-118',
          phone: '9812345678',
          entryTimestamp: Date.now() - 90 * 60 * 1000,
          entryTimeFormatted: new Date(Date.now() - 90 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          dateStr: new Date().toISOString().split('T')[0],
        },
        {
          id: 'seed-3',
          name: 'Kabir Patel',
          roomNumber: 'C-305',
          studentId: 'HS2024-089',
          phone: '9899123456',
          entryTimestamp: Date.now() - 140 * 60 * 1000,
          entryTimeFormatted: new Date(Date.now() - 140 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          dateStr: new Date().toISOString().split('T')[0],
        }
      ];
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(sampleEntries));
      return sampleEntries;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load entries:', err);
    return [];
  }
}

export function saveStoredEntries(entries: PoolEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save entries:', err);
  }
}
