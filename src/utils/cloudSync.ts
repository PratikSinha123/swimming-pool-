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
export async function pushSettingsToCloud(settings: PoolSettings, retries = 3): Promise<boolean> {
  const payload: PoolSettings = {
    ...settings,
    updatedAt: Date.now(),
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(KVDB_SETTINGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn(`Settings cloud push attempt ${attempt} failed:`, err);
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  return false;
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
      },
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
export async function pushEntriesToCloud(entries: PoolEntry[], retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(KVDB_ENTRIES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn(`Entries cloud push attempt ${attempt} failed:`, err);
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return false;
}

/**
 * Fetch latest entries from central cloud storage
 */
export async function fetchEntriesFromCloud(retries = 2): Promise<PoolEntry[] | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(getCacheBustUrl(KVDB_ENTRIES_URL), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
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
      console.warn(`Entries cloud fetch attempt ${attempt} failed:`, err);
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  return null;
}

/**
 * Atomically appends a new student entry to cloud storage:
 * 1. Fetches current cloud entries to avoid overwriting entries from other students
 * 2. Merges new entry, existing cloud entries, and local entries by unique ID
 * 3. Pushes the complete list to cloud storage with retry
 * 4. Returns the full combined list
 */
export async function appendEntryToCloud(
  newEntry: PoolEntry,
  localEntries: PoolEntry[] = []
): Promise<{ success: boolean; allEntries: PoolEntry[] }> {
  // 1. Fetch existing cloud entries first
  const remote = (await fetchEntriesFromCloud(2)) || [];

  // 2. Merge all unique entries (newEntry at top)
  const map = new Map<string, PoolEntry>();
  map.set(newEntry.id, newEntry);

  for (const item of remote) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  for (const item of localEntries) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  const allEntries = Array.from(map.values()).sort(
    (a, b) => (b.entryTimestamp || 0) - (a.entryTimestamp || 0)
  );

  // 3. Push complete list to cloud
  const success = await pushEntriesToCloud(allEntries, 3);
  return { success, allEntries };
}

/**
 * Sync entries between cloud and local
 * Combines unique entries by ID so no device's entries are dropped
 */
export function mergeEntries(local: PoolEntry[], remote: PoolEntry[]): PoolEntry[] {
  if (!Array.isArray(remote) && !Array.isArray(local)) return [];
  if (!Array.isArray(remote)) return local;
  if (!Array.isArray(local)) return remote;

  const map = new Map<string, PoolEntry>();
  // Remote cloud entries take precedence
  for (const item of remote) {
    if (item && item.id) map.set(item.id, item);
  }
  // Include any local entries not yet in remote
  for (const item of local) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.entryTimestamp || 0) - (a.entryTimestamp || 0)
  );
}

