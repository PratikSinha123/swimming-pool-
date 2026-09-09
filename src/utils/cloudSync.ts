import type { PoolEntry, PoolSettings } from '../types';

// Fast, reliable KV endpoints with no request limit
const KVDB_ENTRIES_URL = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_entries_v7';
const KVDB_SETTINGS_URL = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_settings_v7';

function getCacheBustUrl(baseUrl: string): string {
  const nonce = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return `${baseUrl}?_cb=${nonce}`;
}

/**
 * Push settings to central cloud storage so ALL devices update their hours and statuses immediately
 */
export async function pushSettingsToCloud(settings: PoolSettings): Promise<boolean> {
  const payload: PoolSettings = {
    ...settings,
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(KVDB_SETTINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Settings cloud push error:', err);
    return false;
  }
}

/**
 * Fetch latest settings from central cloud storage
 */
export async function fetchSettingsFromCloud(): Promise<PoolSettings | null> {
  try {
    const res = await fetch(getCacheBustUrl(KVDB_SETTINGS_URL), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim() !== '') {
        const parsed = JSON.parse(text);
        if (parsed && parsed.openTime && parsed.closeTime) {
          return parsed as PoolSettings;
        }
      }
    }
  } catch (err) {
    console.warn('Settings cloud fetch error:', err);
  }
  return null;
}

/**
 * Push entries to central cloud storage so all devices stay in sync (or empty array when cleared)
 */
export async function pushEntriesToCloud(entries: PoolEntry[]): Promise<boolean> {
  try {
    const res = await fetch(KVDB_ENTRIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    });
    return res.ok;
  } catch (err) {
    console.warn('Entries cloud push error:', err);
    return false;
  }
}

/**
 * Fetch latest entries from central cloud storage
 */
export async function fetchEntriesFromCloud(): Promise<PoolEntry[] | null> {
  try {
    const res = await fetch(getCacheBustUrl(KVDB_ENTRIES_URL), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim() !== '') {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed as PoolEntry[];
        }
      }
    }
  } catch (err) {
    console.warn('Entries cloud fetch error:', err);
  }
  return null;
}

/**
 * Sync entries between cloud and local
 * - If remote was returned by cloud, remote is the single source of truth!
 * - When remote is empty [], it means records were cleared in cloud.
 */
export function mergeEntries(local: PoolEntry[], remote: PoolEntry[]): PoolEntry[] {
  // If remote is explicitly provided from cloud, it is authoritative
  if (Array.isArray(remote)) {
    return remote;
  }
  return local;
}

