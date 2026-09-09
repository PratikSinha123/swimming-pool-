import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { PoolEntry, PoolSettings, PoolOperatingStatus } from '../types';
import { checkPoolStatus, formatTimestampTime } from '../utils/timeUtils';
import {
  Waves,
  User,
  DoorClosed,
  CheckCircle2,
  AlertTriangle,
  Building,
  RotateCcw,
  Clock,
} from 'lucide-react';

interface StudentEntryPortalProps {
  settings: PoolSettings;
  todayEntriesCount: number;
  onCheckIn: (entry: { name: string; roomNumber: string }) => Promise<PoolEntry | null>;
  onOpenWardenLogin: () => void;
}

export const StudentEntryPortal: React.FC<StudentEntryPortalProps> = ({
  settings,
  todayEntriesCount,
  onCheckIn,
  onOpenWardenLogin,
}) => {
  // Live status & current time update every second
  const [currentTime, setCurrentTime] = useState<string>(() => formatTimestampTime(Date.now()));
  const [poolStatus, setPoolStatus] = useState<PoolOperatingStatus>(() =>
    checkPoolStatus(settings.openTime, settings.closeTime, settings.isOpenManually, settings.mealBreaks)
  );

  // Form states - ONLY Student Name & Room No as requested
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Last submitted record (confirmation banner)
  const [lastSubmittedEntry, setLastSubmittedEntry] = useState<PoolEntry | null>(null);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(formatTimestampTime(now));
      setPoolStatus(checkPoolStatus(settings.openTime, settings.closeTime, settings.isOpenManually, settings.mealBreaks));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter student name.');
      return;
    }
    if (!roomNumber.trim()) {
      setFormError('Please enter hostel room number.');
      return;
    }

    if (!poolStatus.isOpen) {
      setFormError(`Pool is currently closed. Operating hours are ${poolStatus.openTime12h} to ${poolStatus.closeTime12h}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCheckIn({
        name: name.trim(),
        roomNumber: roomNumber.trim().toUpperCase(),
      });

      if (created) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981'],
        });
        setLastSubmittedEntry(created);
        setName('');
        setRoomNumber('');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to record entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full max-w-md flex items-center justify-between py-2 border-b border-cyan-900/40 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Waves className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
              {settings.poolName}
            </h1>
            <span className="text-xs text-cyan-400 font-medium">
              {settings.hostelName}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenWardenLogin}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 transition cursor-pointer"
        >
          Warden
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center">
        {/* If Just Submitted, Show Confirmation Receipt Card */}
        {lastSubmittedEntry ? (
          <div className="w-full bg-slate-900/95 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/30 text-center animate-fade-in relative overflow-hidden">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
              Entry Logged Successfully
            </span>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {lastSubmittedEntry.name}
            </h2>

            <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 my-5 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Hostel Room:</span>
                <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                  {lastSubmittedEntry.roomNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Entry Time:</span>
                <span className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lastSubmittedEntry.entryTimeFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">Pool Hours:</span>
                <span className="text-cyan-400 font-medium">Until {poolStatus.closeTime12h}</span>
              </div>
            </div>

            <button
              onClick={() => setLastSubmittedEntry(null)}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-3 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Record Another Student Entry</span>
            </button>
          </div>
        ) : (
          /* Simplified Student Entry Form: Name & Room No only */
          <div className="w-full bg-slate-900/90 border border-cyan-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
            {/* Operating Hours Banner */}
            <div
              className={`rounded-2xl p-4 mb-5 border transition ${
                poolStatus.isOpen
                  ? 'bg-gradient-to-br from-cyan-950/40 to-blue-950/30 border-cyan-800/60'
                  : 'bg-gradient-to-br from-rose-950/40 to-slate-900/60 border-rose-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      poolStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      poolStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {poolStatus.isOpen ? 'Pool is Open' : 'Pool is Closed'}
                  </span>
                </div>

                <span className="text-[11px] font-mono text-cyan-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentTime}
                </span>
              </div>

              {/* Operating Hours Display */}
              <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">Hours: </span>
                  <span className="font-semibold text-white">
                    {poolStatus.openTime12h} – {poolStatus.closeTime12h}
                  </span>
                </div>
                <div className="text-xs font-medium text-cyan-400">
                  {todayEntriesCount} Entries Today
                </div>
              </div>

              {/* Upcoming Event / Meal Break Reminder */}
              {poolStatus.isOpen && poolStatus.nextEventText && (
                <div className="mt-2 pt-1 text-[11px] text-cyan-300/90 flex items-center gap-1 font-medium">
                  <span>ℹ️ {poolStatus.nextEventText}</span>
                </div>
              )}

              {/* Closed notice */}
              {!poolStatus.isOpen && poolStatus.reason && (
                <div className="mt-2.5 text-xs text-rose-300 bg-rose-950/60 p-2 rounded-lg border border-rose-800/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{poolStatus.reason}</span>
                </div>
              )}
            </div>

            {/* Check-In Header */}
            <div className="mb-5 text-left">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Swimming Pool Student Entry
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your name and room number to record your pool entry. Time is captured automatically.
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form: Student Full Name & Hostel Room No ONLY */}
            <form onSubmit={handleSubmitEntry} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Student Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  disabled={!poolStatus.isOpen}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  Hostel Room No <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 uppercase transition"
                  disabled={!poolStatus.isOpen}
                />
              </div>

              {/* Automatic Time Indication Banner */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Entry Time (Automatic):
                </span>
                <span className="font-mono text-emerald-400 font-semibold">{currentTime}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!poolStatus.isOpen || isSubmitting}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide transition shadow-xl flex items-center justify-center gap-2 ${
                  poolStatus.isOpen
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-98 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isSubmitting ? (
                  <span>Logging entry...</span>
                ) : poolStatus.isOpen ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Record Pool Entry
                  </>
                ) : (
                  <>
                    <DoorClosed className="w-4 h-4" />
                    Pool Closed (Opens {poolStatus.openTime12h})
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4 text-slate-500 text-xs mt-4">
        <span>Hostel Swimming Pool Entry Record System</span>
        <span className="mx-2">•</span>
        <span>Daily Hours: {poolStatus.openTime12h} to {poolStatus.closeTime12h}</span>
      </footer>
    </div>
  );
};
