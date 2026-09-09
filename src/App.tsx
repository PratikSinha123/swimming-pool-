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
import { syncEntryWithGoogleSheets, fetchEntriesFromGoogleSheets } from './utils/googleSheets';
import { pushEntriesToCloud, fetchEntriesFromCloud, mergeEntries } from './utils/cloudSync';
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

  // Refresh records from local storage, Central Cloud Sync, and Google Sheets
  const refreshRecords = useCallback(async () => {
    const local = getStoredEntries();
    let combined = [...local];

    // 1. Fetch from Central Cloud Storage (works across all devices automatically)
    try {
      const cloudEntries = await fetchEntriesFromCloud();
      if (cloudEntries && cloudEntries.length > 0) {
        combined = mergeEntries(combined, cloudEntries);
      }
    } catch (err) {
      console.warn('Cloud sync error:', err);
    }

    // 2. If Google Sheets webhook is configured, also pull latest rows
    if (settings.googleSheetsWebhookUrl) {
      try {
        const remote = await fetchEntriesFromGoogleSheets(settings.googleSheetsWebhookUrl);
        if (remote && remote.length > 0) {
          combined = mergeEntries(combined, remote);
        }
      } catch (err) {
        console.warn('Google Sheets sync error:', err);
      }
    }

    setEntries(combined);
    saveStoredEntries(combined);
    return combined;
  }, [settings.googleSheetsWebhookUrl]);

  // Initial mount sync & real-time periodic polling (every 5 seconds) across devices
  useEffect(() => {
    refreshRecords();
    const timer = setInterval(() => {
      refreshRecords();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshRecords]);

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
      id: `entry-${now}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name.trim(),
      roomNumber: data.roomNumber.trim().toUpperCase(),
      entryTimestamp: now,
      entryTimeFormatted: formatTimestampTime(now),
      dateStr: localDate,
      isMealBreakEntry: data.isMealBreakEntry,
      entryNotice: data.entryNotice,
    };

    // 1. Read directly from storage to avoid stale closure
    const current = getStoredEntries();
    const updated = [newEntry, ...current.filter((e) => e.id !== newEntry.id)];
    setEntries(updated);
    saveStoredEntries(updated);

    // 2. Push immediately to Central Cloud Storage (so Warden screen updates instantly)
    pushEntriesToCloud(updated).catch((e) => console.warn('Cloud push error:', e));

    // 3. Sync to Google Sheets in background if configured
    if (settings.googleSheetsWebhookUrl) {
      syncEntryWithGoogleSheets(settings.googleSheetsWebhookUrl, newEntry).catch((e) =>
        console.warn('Google Sheets error:', e)
      );
    }

    return newEntry;
  };

  // Handle Settings Update
  const handleUpdateSettings = (newSettings: PoolSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
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
