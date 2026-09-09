import type { PoolEntry, PoolSettings, MealBreak } from '../types';

export const SETTINGS_KEY = 'hostel_pool_settings_v6';
export const ENTRIES_KEY = 'hostel_pool_entries_v6';
export const WARDEN_REMEMBERED_KEY = 'hostel_pool_warden_remembered_v1';

export function getIsWardenRemembered(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(WARDEN_REMEMBERED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setIsWardenRemembered(remember: boolean): void {
  try {
    if (remember) {
      localStorage.setItem(WARDEN_REMEMBERED_KEY, 'true');
    } else {
      localStorage.removeItem(WARDEN_REMEMBERED_KEY);
    }
  } catch (err) {
    console.error('Failed to set warden remembered state:', err);
  }
}

export const DEFAULT_MEAL_BREAKS: MealBreak[] = [
  { id: 'breakfast', name: 'Morning Breakfast', startTime: '07:30', endTime: '09:00', enabled: true },
  { id: 'lunch', name: 'Lunch Interval', startTime: '12:00', endTime: '14:00', enabled: true },
  { id: 'snacks', name: 'Evening Snacks', startTime: '17:30', endTime: '18:30', enabled: true },
  { id: 'dinner', name: 'Night Meal / Dinner', startTime: '20:00', endTime: '21:15', enabled: true },
];

export const DEFAULT_SETTINGS: PoolSettings = {
  poolName: 'Hostel Swimming Pool',
  hostelName: 'Hostel Campus',
  openTime: '06:00', // 6:00 AM
  closeTime: '22:30', // 10:30 PM
  isOpenManually: true,
  wardenPin: 'Ramesh1234',
  googleSheetsWebhookUrl: '',
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
  mealBreaks: DEFAULT_MEAL_BREAKS,
};

export function getStoredSettings(): PoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      mealBreaks: parsed.mealBreaks || DEFAULT_MEAL_BREAKS,
    };
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
