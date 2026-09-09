import { useState, useEffect, useCallback } from 'react';
import type { PoolEntry, PoolSettings } from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredEntries,
  saveStoredEntries,
  isWardenDeviceAuthenticated,
  setWardenDeviceAuthenticated,
  getActiveView,
  saveActiveView,
  ENTRIES_KEY,
} from './utils/storage';
import { formatTimestampTime } from './utils/timeUtils';
import {
  pushEntriesToCloud,
  fetchEntriesFromCloud,
  appendEntryToCloud,
  mergeEntries,
  pushSettingsToCloud,
  fetchSettingsFromCloud,
} from './utils/cloudSync';
import { StudentEntryPortal } from './components/StudentEntryPortal';
import { WardenPanel } from './components/WardenPanel';
import { WardenAuthModal } from './components/WardenAuthModal';
import { QRCodePoster } from './components/QRCodePoster';

export default function App() {
  const [settings, setSettings] = useState<PoolSettings>(getStoredSettings);
  const [entries, setEntries] = useState<PoolEntry[]>(getStoredEntries);

  // Persistent Warden Authentication
  const [isWardenAuth, setIsWardenAuth] = useState<boolean>(() => isWardenDeviceAuthenticated());
  // Active View: 'warden' | 'student'
  const [activeView, setActiveView] = useState<'warden' | 'student'>(() => getActiveView());

  const [showWardenAuth, setShowWardenAuth] = useState(false);
  const [showQRPoster, setShowQRPoster] = useState(false);

  // Refresh settings from Central Cloud Storage (so time changes made on one phone propagate to all phones)
  const refreshSettings = useCallback(async () => {
    try {
      const cloudSettings = await fetchSettingsFromCloud();
      if (cloudSettings && cloudSettings.openTime && cloudSettings.closeTime) {
        setSettings((prev) => {
          const hasChanged =
            prev.openTime !== cloudSettings.openTime ||
            prev.closeTime !== cloudSettings.closeTime ||
            prev.isOpenManually !== cloudSettings.isOpenManually ||
            prev.poolName !== cloudSettings.poolName ||
            prev.hostelName !== cloudSettings.hostelName ||
            prev.wardenPin !== cloudSettings.wardenPin ||
            JSON.stringify(prev.mealBreaks) !== JSON.stringify(cloudSettings.mealBreaks);

          if (hasChanged || (cloudSettings.updatedAt && cloudSettings.updatedAt !== prev.updatedAt)) {
            const merged = {
              ...prev,
              ...cloudSettings,
            };
            saveStoredSettings(merged);
            return merged;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Settings cloud sync warning:', err);
    }
  }, []);

  // Refresh records from Central Cloud Sync & local storage
  const refreshRecords = useCallback(async () => {
    const local = getStoredEntries();

    try {
      const cloudEntries = await fetchEntriesFromCloud(2);
      if (Array.isArray(cloudEntries)) {
        if (cloudEntries.length === 0) {
          // Cloud was explicitly cleared
          setEntries([]);
          saveStoredEntries([]);
          return [];
        }
        const merged = mergeEntries(local, cloudEntries);
        setEntries(merged);
        saveStoredEntries(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Cloud sync error:', err);
    }

    setEntries(local);
    return local;
  }, []);

  // Initial mount sync, tab visibility sync, & smart periodic polling
  useEffect(() => {
    refreshRecords();
    refreshSettings();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRecords();
        refreshSettings();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Polling interval:
    // When Warden Panel is open: poll records every 4s to catch live incoming student entries
    // When on Student view: only poll settings every 20s to conserve bandwidth
    const intervalMs = activeView === 'warden' ? 4000 : 20000;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        if (activeView === 'warden') {
          refreshRecords();
        }
        refreshSettings();
      }
    }, intervalMs);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [activeView, refreshRecords, refreshSettings]);

  // Sync across tabs and windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ENTRIES_KEY) {
        setEntries(getStoredEntries());
      }
    };
    const handleLocalUpdate = () => {
      setEntries(getStoredEntries());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pool_entries_updated', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pool_entries_updated', handleLocalUpdate);
    };
  }, []);

  // Listen for hash or popstate changes
  useEffect(() => {
    const handleHashOrPopState = () => {
      const view = getActiveView();
      setActiveView(view);
      setIsWardenAuth(isWardenDeviceAuthenticated());
    };
    window.addEventListener('popstate', handleHashOrPopState);
    window.addEventListener('hashchange', handleHashOrPopState);
    return () => {
      window.removeEventListener('popstate', handleHashOrPopState);
      window.removeEventListener('hashchange', handleHashOrPopState);
    };
  }, []);

  // When in warden view and authenticated, refresh records
  useEffect(() => {
    if (activeView === 'warden' && isWardenAuth) {
      refreshRecords();
    }
  }, [activeView, isWardenAuth, refreshRecords]);

  // Handle Student Check-In (ONLY Name & Room No)
  const handleCheckIn = async (data: {
    name: string;
    roomNumber: string;
    isMealBreakEntry?: boolean;
    entryNotice?: string;
  }): Promise<PoolEntry | null> => {
    const now = Date.now();
    const localDate = new Date(now).toLocaleDateString('en-CA'); // Local YYYY-MM-DD
    const newEntry: PoolEntry = {
      id: `entry-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      roomNumber: data.roomNumber.trim().toUpperCase(),
      entryTimestamp: now,
      entryTimeFormatted: formatTimestampTime(now),
      dateStr: localDate,
      isMealBreakEntry: data.isMealBreakEntry,
      entryNotice: data.entryNotice,
    };

    // 1. Save locally first for snappy UI feedback
    const local = getStoredEntries();
    const updatedLocal = [newEntry, ...local.filter((e) => e.id !== newEntry.id)];
    setEntries(updatedLocal);
    saveStoredEntries(updatedLocal);

    // 2. Atomically append to cloud with retries, awaiting so mobile browser cannot abort request
    try {
      const { allEntries } = await appendEntryToCloud(newEntry, updatedLocal);
      if (allEntries && allEntries.length > 0) {
        setEntries(allEntries);
        saveStoredEntries(allEntries);
      }
    } catch (err) {
      console.warn('Cloud append error:', err);
    }

    return newEntry;
  };

  // Handle Settings Update (Saves locally and broadcasts to ALL phones/devices via cloud)
  const handleUpdateSettings = async (newSettings: PoolSettings): Promise<void> => {
    const updatedWithTimestamp: PoolSettings = {
      ...newSettings,
      updatedAt: Date.now(),
    };
    setSettings(updatedWithTimestamp);
    saveStoredSettings(updatedWithTimestamp);
    await pushSettingsToCloud(updatedWithTimestamp);
  };

  // Clear all entries across local and central cloud storage
  const handleClearAllRecords = async (): Promise<void> => {
    setEntries([]);
    saveStoredEntries([]);
    await pushEntriesToCloud([], 3);
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayEntriesCount = entries.filter((e) => e.dateStr === todayStr).length;

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Student Entry Screen */}
      {(!isWardenAuth || activeView === 'student') && (
        <StudentEntryPortal
          settings={settings}
          todayEntriesCount={todayEntriesCount}
          onCheckIn={handleCheckIn}
          isWardenLoggedIn={isWardenAuth}
          onOpenWardenLogin={() => {
            if (isWardenAuth) {
              setActiveView('warden');
              saveActiveView('warden');
            } else {
              setShowWardenAuth(true);
            }
          }}
        />
      )}

      {/* Warden Auth Modal (PIN prompt) */}
      {showWardenAuth && (
        <WardenAuthModal
          correctPin={settings.wardenPin}
          onSuccess={() => {
            setShowWardenAuth(false);
            setIsWardenAuth(true);
            setActiveView('warden');
            saveActiveView('warden');
          }}
          onClose={() => setShowWardenAuth(false)}
        />
      )}

      {/* Warden Management Panel */}
      {isWardenAuth && activeView === 'warden' && (
        <WardenPanel
          settings={settings}
          entries={entries}
          onUpdateSettings={handleUpdateSettings}
          onClearAllRecords={handleClearAllRecords}
          onClosePanel={() => {
            setActiveView('student');
            saveActiveView('student');
          }}
          onOpenQRPoster={() => setShowQRPoster(true)}
          onRefreshRecords={refreshRecords}
          onLockWarden={() => {
            setWardenDeviceAuthenticated(false);
            setIsWardenAuth(false);
            setActiveView('student');
            saveActiveView('student');
          }}
        />
      )}

      {/* Printable Entrance QR Poster Modal */}
      {showQRPoster && (
        <QRCodePoster
          settings={settings}
          onClose={() => setShowQRPoster(false)}
        />
      )}
    </div>
  );
}
