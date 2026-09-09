import type { PoolEntry, PoolSettings, MealBreak } from '../types';

export const SETTINGS_KEY = 'hostel_pool_settings_v7';
export const ENTRIES_KEY = 'hostel_pool_entries_v7';
export const WARDEN_REMEMBERED_KEY = 'hostel_pool_warden_remembered_v1';
export const WARDEN_PERMANENT_AUTH_KEY = 'hostel_pool_warden_permanent_auth_v2';
export const ACTIVE_VIEW_KEY = 'hostel_pool_active_view_v2';

export function isWardenDeviceAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(WARDEN_PERMANENT_AUTH_KEY) === 'true' ||
      localStorage.getItem(WARDEN_REMEMBERED_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

export function setWardenDeviceAuthenticated(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(WARDEN_PERMANENT_AUTH_KEY, 'true');
      localStorage.setItem(WARDEN_REMEMBERED_KEY, 'true');
      localStorage.setItem(ACTIVE_VIEW_KEY, 'warden');
    } else {
      localStorage.removeItem(WARDEN_PERMANENT_AUTH_KEY);
      localStorage.removeItem(WARDEN_REMEMBERED_KEY);
      localStorage.setItem(ACTIVE_VIEW_KEY, 'student');
    }
  } catch (err) {
    console.error('Failed to set warden device auth state:', err);
  }
}

export function getActiveView(): 'warden' | 'student' {
  if (typeof window === 'undefined') return 'student';
  try {
    const url = new URL(window.location.href);
    if (
      url.searchParams.has('warden') ||
      url.searchParams.has('admin') ||
      window.location.hash.includes('warden') ||
      window.location.hash.includes('admin')
    ) {
      return 'warden';
    }
    if (url.searchParams.has('student') || window.location.hash.includes('student')) {
      return 'student';
    }

    if (isWardenDeviceAuthenticated()) {
      const savedView = localStorage.getItem(ACTIVE_VIEW_KEY);
      if (savedView === 'student') return 'student';
      return 'warden';
    }

    return 'student';
  } catch {
    return 'student';
  }
}

export function saveActiveView(view: 'warden' | 'student'): void {
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, view);
  } catch (err) {
    console.error('Failed to save active view:', err);
  }
}

// Backward compatibility helpers
export const getIsWardenRemembered = isWardenDeviceAuthenticated;
export const setIsWardenRemembered = setWardenDeviceAuthenticated;

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

export const ARCHIVE_KEY = 'hostel_pool_entries_permanent_archive_v7';

export function getStoredEntries(): PoolEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    let entries: PoolEntry[] = raw ? JSON.parse(raw) : [];

    // If current entries is empty, check legacy keys to recover any historical student data!
    if (!Array.isArray(entries) || entries.length === 0) {
      const legacyKeys = ['hostel_pool_entries_v6', 'hostel_pool_entries_v5', 'hostel_pool_entries_v4', 'hostel_pool_entries'];
      for (const k of legacyKeys) {
        try {
          const legRaw = localStorage.getItem(k);
          if (legRaw) {
            const parsed = JSON.parse(legRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              entries = parsed;
              localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
              break;
            }
          }
        } catch {}
      }
    }

    // Also fallback to permanent archive if still empty
    if (!Array.isArray(entries) || entries.length === 0) {
      try {
        const archRaw = localStorage.getItem(ARCHIVE_KEY);
        if (archRaw) {
          const archParsed = JSON.parse(archRaw);
          if (Array.isArray(archParsed) && archParsed.length > 0) {
            entries = archParsed;
            localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
          }
        }
      } catch {}
    }

    return Array.isArray(entries) ? entries : [];
  } catch (err) {
    console.error('Failed to load entries:', err);
    return [];
  }
}

export function saveStoredEntries(entries: PoolEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));

    // Save to permanent archive so student data is NEVER lost
    if (Array.isArray(entries) && entries.length > 0) {
      try {
        const archRaw = localStorage.getItem(ARCHIVE_KEY);
        const existingArchive: PoolEntry[] = archRaw ? JSON.parse(archRaw) : [];
        const map = new Map<string, PoolEntry>();
        for (const e of entries) {
          if (e && e.id) map.set(e.id, e);
        }
        for (const e of existingArchive) {
          if (e && e.id && !map.has(e.id)) map.set(e.id, e);
        }
        const combinedArchive = Array.from(map.values()).sort(
          (a, b) => (b.entryTimestamp || 0) - (a.entryTimestamp || 0)
        );
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(combinedArchive));
      } catch (archErr) {
        console.warn('Archive save warning:', archErr);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pool_entries_updated'));
    }
  } catch (err) {
    console.error('Failed to save entries:', err);
  }
}

export function clearStoredEntries(): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pool_entries_updated'));
    }
  } catch (err) {
    console.error('Failed to clear entries:', err);
  }
}

