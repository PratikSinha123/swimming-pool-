import type { PoolEntry } from '../types';

// Central key-value cloud storage endpoint for real-time cross-device sync
const CLOUD_SYNC_ENDPOINT = 'https://kvdb.io/FdXCyHjkaVYMvEACD3pVMF/pool_entries';

/**
 * Push entries to central cloud storage so all devices stay in sync
 */
export async function pushEntriesToCloud(entries: PoolEntry[]): Promise<boolean> {
  try {
    const res = await fetch(CLOUD_SYNC_ENDPOINT, {
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
    const res = await fetch(`${CLOUD_SYNC_ENDPOINT}?t=${Date.now()}`, {
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
