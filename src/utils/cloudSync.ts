import type { PoolEntry, PoolSettings } from '../types';

// Central key-value cloud storage endpoints for real-time cross-device sync
const CLOUD_ENTRIES_ENDPOINT = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_entries';
const CLOUD_SETTINGS_ENDPOINT = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_settings';

/**
 * Push settings to central cloud storage so ALL phones and laptops update their times immediately
 */
export async function pushSettingsToCloud(settings: PoolSettings): Promise<boolean> {
  try {
    const payload: PoolSettings = {
      ...settings,
      updatedAt: Date.now(),
    };
    const res = await fetch(CLOUD_SETTINGS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud settings push warning:', err);
    return false;
  }
}

/**
 * Fetch latest settings from central cloud storage
 */
export async function fetchSettingsFromCloud(): Promise<PoolSettings | null> {
  try {
    const res = await fetch(`${CLOUD_SETTINGS_ENDPOINT}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim() === '' || text.trim() === '{}') return null;
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && parsed.openTime && parsed.closeTime) {
      return parsed as PoolSettings;
    }
    return null;
  } catch (err) {
    console.warn('Cloud settings fetch warning:', err);
    return null;
  }
}

/**
 * Push entries to central cloud storage so all devices stay in sync
 */
export async function pushEntriesToCloud(entries: PoolEntry[]): Promise<boolean> {
  try {
    const res = await fetch(CLOUD_ENTRIES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entries),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud sync push warning (will rely on local storage):', err);
    return false;
  }
}

/**
 * Fetch latest entries from central cloud storage
 */
export async function fetchEntriesFromCloud(): Promise<PoolEntry[] | null> {
  try {
    const res = await fetch(`${CLOUD_ENTRIES_ENDPOINT}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim() === '' || text.trim() === '[]') return [];
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Cloud sync fetch warning (will rely on local storage):', err);
    return null;
  }
}

/**
 * Merge local entries and cloud entries safely without duplication
 */
export function mergeEntries(local: PoolEntry[], remote: PoolEntry[]): PoolEntry[] {
  const map = new Map<string, PoolEntry>();

  for (const item of remote) {
    const key = item.id || `${item.name}-${item.entryTimestamp || item.entryTimeFormatted}`;
    map.set(key, item);
  }

  for (const item of local) {
    const key = item.id || `${item.name}-${item.entryTimestamp || item.entryTimeFormatted}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.entryTimestamp || 0) - (a.entryTimestamp || 0));
}
