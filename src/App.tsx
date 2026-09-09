import { useState, useEffect, useCallback } from 'react';
import type { PoolEntry, PoolSettings } from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredEntries,
  saveStoredEntries,
  ENTRIES_KEY,
} from './utils/storage';
import { formatTimestampTime } from './utils/timeUtils';
import { syncEntryWithGoogleSheets, fetchEntriesFromGoogleSheets } from './utils/googleSheets';
import { StudentEntryPortal } from './components/StudentEntryPortal';
import { WardenPanel } from './components/WardenPanel';
import { WardenAuthModal } from './components/WardenAuthModal';
import { QRCodePoster } from './components/QRCodePoster';

export default function App() {
  const [settings, setSettings] = useState<PoolSettings>(getStoredSettings);
  const [entries, setEntries] = useState<PoolEntry[]>(getStoredEntries);

  // Modals & Panels
  const [isWardenUnlocked, setIsWardenUnlocked] = useState(false);
  const [showWardenAuth, setShowWardenAuth] = useState(false);
  const [showQRPoster, setShowQRPoster] = useState(false);

  // Refresh records from local storage and optionally Google Sheets
  const refreshRecords = useCallback(async () => {
    const local = getStoredEntries();
    setEntries(local);

    // If Google Sheets webhook is configured, also pull latest rows
    if (settings.googleSheetsWebhookUrl) {
      const remote = await fetchEntriesFromGoogleSheets(settings.googleSheetsWebhookUrl);
      if (remote && remote.length > 0) {
        // Merge remote and local (avoiding duplicates by id or name+timestamp)
        const combined = [...remote];
        for (const loc of local) {
          if (!combined.some((c) => c.id === loc.id || (c.name === loc.name && c.entryTimeFormatted === loc.entryTimeFormatted))) {
            combined.push(loc);
          }
        }
        setEntries(combined);
        saveStoredEntries(combined);
      }
    }
  }, [settings.googleSheetsWebhookUrl]);

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

  // When warden unlocks panel, refresh immediately
  useEffect(() => {
    if (isWardenUnlocked) {
      refreshRecords();
    }
  }, [isWardenUnlocked, refreshRecords]);

  // Handle Student Check-In (ONLY Name & Room No)
  const handleCheckIn = async (data: { name: string; roomNumber: string }): Promise<PoolEntry | null> => {
    const now = Date.now();
    const newEntry: PoolEntry = {
      id: `entry-${now}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name.trim(),
      roomNumber: data.roomNumber.trim().toUpperCase(),
      entryTimestamp: now,
      entryTimeFormatted: formatTimestampTime(now),
      dateStr: new Date(now).toISOString().split('T')[0],
    };

    // Read directly from storage to avoid stale closure
    const current = getStoredEntries();
    const updated = [newEntry, ...current];
    setEntries(updated);
    saveStoredEntries(updated);

    // Sync to Google Sheets in background if configured
    if (settings.googleSheetsWebhookUrl) {
      syncEntryWithGoogleSheets(settings.googleSheetsWebhookUrl, newEntry);
    }

    return newEntry;
  };

  // Handle Settings Update
  const handleUpdateSettings = (newSettings: PoolSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntriesCount = entries.filter((e) => e.dateStr === todayStr).length;

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Student Entry Screen */}
      <StudentEntryPortal
        settings={settings}
        todayEntriesCount={todayEntriesCount}
        onCheckIn={handleCheckIn}
        onOpenWardenLogin={() => {
          if (isWardenUnlocked) {
            setIsWardenUnlocked(true);
          } else {
            setShowWardenAuth(true);
          }
        }}
      />

      {/* Warden Auth Modal (PIN prompt) */}
      {showWardenAuth && (
        <WardenAuthModal
          correctPin={settings.wardenPin}
          onSuccess={() => {
            setShowWardenAuth(false);
            setIsWardenUnlocked(true);
          }}
          onClose={() => setShowWardenAuth(false)}
        />
      )}

      {/* Warden Management Panel */}
      {isWardenUnlocked && (
        <WardenPanel
          settings={settings}
          entries={entries}
          onUpdateSettings={handleUpdateSettings}
          onClosePanel={() => setIsWardenUnlocked(false)}
          onOpenQRPoster={() => setShowQRPoster(true)}
          onRefreshRecords={refreshRecords}
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
