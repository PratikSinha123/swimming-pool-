import type { PoolEntry, PoolSettings } from '../types';

// Dynamic RESTful Cloud storage (cf-cache-status: DYNAMIC, zero edge-cache lag)
const RESTFUL_SETTINGS_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a0863b43ee57d0';
const RESTFUL_ENTRIES_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a0863b8c6e57d1';

// Fallback endpoints on kvdb.io
const KVDB_ENTRIES_URL = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_entries';
const KVDB_SETTINGS_URL = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_settings';

/**
 * Push settings to central cloud storage so ALL phones update their times immediately
 */
export async function pushSettingsToCloud(settings: PoolSettings): Promise<boolean> {
  const payload: PoolSettings = {
    ...settings,
    updatedAt: Date.now(),
  };

  try {
    const res = await fetch(RESTFUL_SETTINGS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hostel Swimming Pool Settings',
        data: payload,
      }),
    });
    if (res.ok) {
      // Also update fallback in background
      fetch(KVDB_SETTINGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('Primary cloud settings push warning:', err);
  }

  // Fallback to kvdb
  try {
    const res = await fetch(KVDB_SETTINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Fallback settings push warning:', err);
    return false;
  }
}

/**
 * Fetch latest settings from central cloud storage
 */
export async function fetchSettingsFromCloud(): Promise<PoolSettings | null> {
  try {
    const res = await fetch(`${RESTFUL_SETTINGS_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.openTime && json.data.closeTime) {
        return json.data as PoolSettings;
      }
    }
  } catch (err) {
    console.warn('Primary settings fetch warning:', err);
  }

  // Fallback
  try {
    const res = await fetch(`${KVDB_SETTINGS_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
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
    console.warn('Fallback settings fetch warning:', err);
  }

  return null;
}

/**
 * Push entries to central cloud storage so all devices stay in sync
 */
export async function pushEntriesToCloud(entries: PoolEntry[]): Promise<boolean> {
  try {
    const res = await fetch(RESTFUL_ENTRIES_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hostel Swimming Pool Entries',
        data: { entries },
      }),
    });
    if (res.ok) {
      fetch(KVDB_ENTRIES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      }).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('Primary entries push warning:', err);
  }

  // Fallback
  try {
    const res = await fetch(KVDB_ENTRIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    });
    return res.ok;
  } catch (err) {
    console.warn('Fallback entries push warning:', err);
    return false;
  }
}

/**
 * Fetch latest entries from central cloud storage
 */
export async function fetchEntriesFromCloud(): Promise<PoolEntry[] | null> {
  try {
    const res = await fetch(`${RESTFUL_ENTRIES_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.entries)) {
        return json.data.entries as PoolEntry[];
      }
    }
  } catch (err) {
    console.warn('Primary entries fetch warning:', err);
  }

  // Fallback
  try {
    const res = await fetch(`${KVDB_ENTRIES_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
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
    console.warn('Fallback entries fetch warning:', err);
  }

  return null;
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
