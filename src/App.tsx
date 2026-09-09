import { useState } from 'react';
import type { PoolEntry, PoolSettings } from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredEntries,
  saveStoredEntries,
} from './utils/storage';
import { formatTimestampTime } from './utils/timeUtils';
import { syncEntryWithGoogleSheets } from './utils/googleSheets';
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

  // Handle Student Check-In
  const handleCheckIn = async (
    data: Omit<PoolEntry, 'id' | 'entryTimestamp' | 'entryTimeFormatted' | 'dateStr'>
  ): Promise<PoolEntry | null> => {
    const now = Date.now();
    const newEntry: PoolEntry = {
      id: `entry-${now}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name,
      roomNumber: data.roomNumber,
      studentId: data.studentId,
      phone: data.phone,
      entryTimestamp: now,
      entryTimeFormatted: formatTimestampTime(now),
      dateStr: new Date(now).toISOString().split('T')[0],
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveStoredEntries(updated);

    // Sync to Google Sheets in background
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
        onOpenQRPoster={() => setShowQRPoster(true)}
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
