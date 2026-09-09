import React, { useState, useEffect } from 'react';
import type { PoolEntry, PoolSettings } from '../types';
import { format24To12 } from '../utils/timeUtils';
import {
  Shield,
  Clock,
  QrCode,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Calendar,
  RotateCw,
  Lock,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface WardenPanelProps {
  settings: PoolSettings;
  entries: PoolEntry[];
  onUpdateSettings: (newSettings: PoolSettings) => Promise<void> | void;
  onClearAllRecords: () => Promise<void> | void;
  onClosePanel: () => void;
  onOpenQRPoster: () => void;
  onRefreshRecords: () => void;
  onLockWarden: () => void;
}

export const WardenPanel: React.FC<WardenPanelProps> = ({
  settings,
  entries,
  onUpdateSettings,
  onClearAllRecords,
  onClosePanel,
  onOpenQRPoster,
  onRefreshRecords,
  onLockWarden,
}) => {
  // Tabs: 'records' | 'settings'
  const [activeTab, setActiveTab] = useState<'records' | 'settings'>('records');

  // Local settings draft form
  const [draftSettings, setDraftSettings] = useState<PoolSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Keep draft settings synced when newer settings are received from cloud
  useEffect(() => {
    if (settings.updatedAt && (!draftSettings.updatedAt || settings.updatedAt > draftSettings.updatedAt)) {
      setDraftSettings({ ...settings });
    }
  }, [settings, draftSettings.updatedAt]);

  // History search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayEntries = entries.filter((e) => e.dateStr === todayStr);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshRecords();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await onClearAllRecords();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const toSave: PoolSettings = {
      ...draftSettings,
      updatedAt: Date.now(),
    };
    setDraftSettings(toSave);
    try {
      await onUpdateSettings(toSave);
    } finally {
      setIsSavingSettings(false);
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 4000);
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert('No entries to export yet.');
      return;
    }

    const headers = ['Record ID', 'Date', 'Student Name', 'Hostel Room No', 'Entry Time'];
    const rows = entries.map((e) => [
      e.id,
      e.dateStr,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.roomNumber}"`,
      `"${e.entryTimeFormatted}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `swimming_pool_entries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter entries
  const filteredEntries = entries.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (dateFilter === 'today') {
      return matchesSearch && item.dateStr === todayStr;
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/90 flex-shrink-0 pt-safe">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span>Warden Panel</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex-shrink-0">
                Live
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              {settings.hostelName} • {settings.poolName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95"
            title="Refresh latest entries from records"
          >
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button
            onClick={onOpenQRPoster}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 active:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl transition cursor-pointer active:scale-95"
            title="Entrance QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QR Code</span>
          </button>
          <button
            onClick={onClosePanel}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95"
            title="Switch to Student Entry form while keeping this device logged in"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Student Form</span>
          </button>
          <button
            onClick={onLockWarden}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 active:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl transition cursor-pointer active:scale-95"
            title="Sign out of this device (passcode will be required next time)"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 border-b border-slate-800 bg-slate-900/50 overflow-x-auto no-scrollbar flex-nowrap flex-shrink-0">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex-shrink-0 active:scale-95 ${
            activeTab === 'records'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Student Entries ({entries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex-shrink-0 active:scale-95 ${
            activeTab === 'settings'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Pool Operating Hours ({format24To12(settings.openTime)} – {format24To12(settings.closeTime)})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-5xl w-full mx-auto pb-safe">
        {/* ========================================================
            TAB 1: STUDENT ENTRY RECORDS
            ======================================================== */}
        {activeTab === 'records' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top Stat Cards (2x2 on mobile, 4 columns on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Today's Entries */}
              <div className="bg-slate-900/90 border border-cyan-900/40 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Today's Entries</span>
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                  {todayEntries.length}{' '}
                  <span className="text-xs sm:text-sm font-normal text-slate-400">today</span>
                </div>
                <span className="block text-[10px] sm:text-[11px] text-emerald-400 mt-1 sm:mt-2 truncate">
                  Logged today
                </span>
              </div>

              {/* All-Time Total Entries */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>All-Time Records</span>
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                  {entries.length}{' '}
                  <span className="text-xs sm:text-sm font-normal text-slate-400">records</span>
                </div>
                <span className="block text-[10px] sm:text-[11px] text-cyan-400 mt-1 sm:mt-2 truncate">
                  Total student check-ins
                </span>
              </div>

              {/* Operating Hours */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Pool Status</span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${
                      draftSettings.isOpenManually ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {draftSettings.isOpenManually ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="text-sm sm:text-xl font-bold text-white tracking-tight truncate mt-1">
                  {format24To12(settings.openTime)} – {format24To12(settings.closeTime)}
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  Adjust hours →
                </button>
              </div>

              {/* Entrance QR Poster Card */}
              <div className="bg-slate-900/90 border border-cyan-800/40 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Entrance QR</span>
                  <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                </div>
                <div className="text-sm sm:text-lg font-bold text-white tracking-tight mt-1 truncate">
                  Poster Code
                </div>
                <button
                  onClick={onOpenQRPoster}
                  className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  View & Print →
                </button>
              </div>
            </div>

            {/* Entries Filter & Table / Mobile Cards */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    Student Swimming Pool Entry Log
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showing Student Name, Hostel Room No, Date, and Automatic Entry Time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-xl transition cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={entries.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear all student entry records"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Records</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="search"
                    placeholder="Search student or room number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                      dateFilter === 'all'
                        ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Time ({entries.length})
                  </button>
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                      dateFilter === 'today'
                        ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Today Only ({todayEntries.length})
                  </button>
                </div>
              </div>

              {/* MOBILE VIEW (Card Feed on Phone Screens) */}
              <div className="block md:hidden space-y-2.5">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                    No student entry records found. When students scan the QR code and submit, their entries will appear here.
                  </div>
                ) : (
                  filteredEntries.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 transition shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="font-mono bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-md border border-cyan-800 text-xs font-bold">
                            {item.roomNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{item.entryTimeFormatted}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="font-bold text-white text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {item.dateStr === todayStr ? 'Today' : item.dateStr}
                        </div>
                      </div>

                      {item.isMealBreakEntry && (
                        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{item.entryNotice || 'Meal Break Entry'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* DESKTOP VIEW (Table on Tablet / Desktop Screens) */}
              <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Hostel Room No</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Automatic Entry Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            No student entry records found. When students scan the QR code and submit, their entries will appear here.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3.5 text-slate-500 font-mono">{index + 1}</td>
                            <td className="p-3.5 font-bold text-white text-sm">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isMealBreakEntry && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60"
                                    title={item.entryNotice}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                    Meal Break Entry
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-mono bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-800/60 font-bold text-xs">
                                {item.roomNumber}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400">{item.dateStr}</td>
                            <td className="p-3.5 text-emerald-400 font-semibold text-sm">
                              {item.entryTimeFormatted}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: OPERATING HOURS CONFIGURATION
            ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pool Operating Hours & Settings
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure daily opening and closing hours, titles, and warden security passcode.
              </p>
            </div>

            {settingsSaved && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-white">Settings Saved & Broadcast Successfully!</span>
                  <span className="text-emerald-300">All phones and computers will automatically sync and use these new hours.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5 sm:space-y-6 text-left">
              {/* OPERATING HOURS */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Pool Daily Operating Hours
                  </span>
                  <span className="text-xs text-slate-400">
                    Currently: {format24To12(draftSettings.openTime)} – {format24To12(draftSettings.closeTime)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Opening Time (Morning)
                    </label>
                    <input
                      type="time"
                      required
                      value={draftSettings.openTime}
                      onChange={(e) => setDraftSettings({ ...draftSettings, openTime: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
                    />
                    <span className="block text-[11px] text-slate-400 mt-1">
                      Converts to: <strong>{format24To12(draftSettings.openTime)}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Closing Time (Evening)
                    </label>
                    <input
                      type="time"
                      required
                      value={draftSettings.closeTime}
                      onChange={(e) => setDraftSettings({ ...draftSettings, closeTime: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
                    />
                    <span className="block text-[11px] text-slate-400 mt-1">
                      Converts to: <strong>{format24To12(draftSettings.closeTime)}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                  ℹ️ <strong>Enforced Rule:</strong> Outside these hours (e.g. after {format24To12(draftSettings.closeTime)} or before {format24To12(draftSettings.openTime)}), student QR check-in is locked.
                </div>
              </div>

              {/* MEAL BREAKS & INTERVALS CONFIGURATION */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Meal Intervals (Pool Closed During Breaks)
                  </span>
                  <span className="text-xs text-slate-400">
                    Hostel Meal Schedule
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The pool will automatically close during these intervals and reopen when the break ends. You can adjust times or toggle any break.
                </p>

                <div className="space-y-2.5 sm:space-y-3">
                  {(draftSettings.mealBreaks || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                        item.enabled ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-900/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedBreaks = [...draftSettings.mealBreaks];
                            updatedBreaks[idx] = { ...item, enabled: !item.enabled };
                            setDraftSettings({ ...draftSettings, mealBreaks: updatedBreaks });
                          }}
                          className={`relative inline-flex h-6 w-10 items-center rounded-full transition cursor-pointer flex-shrink-0 ${
                            item.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              item.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div>
                          <span className="text-xs font-bold text-white block">{item.name}</span>
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {format24To12(item.startTime)} – {format24To12(item.endTime)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => {
                            const updatedBreaks = [...draftSettings.mealBreaks];
                            updatedBreaks[idx] = { ...item, startTime: e.target.value };
                            setDraftSettings({ ...draftSettings, mealBreaks: updatedBreaks });
                          }}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-white font-mono focus:outline-none focus:border-cyan-400 min-h-[38px]"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => {
                            const updatedBreaks = [...draftSettings.mealBreaks];
                            updatedBreaks[idx] = { ...item, endTime: e.target.value };
                            setDraftSettings({ ...draftSettings, mealBreaks: updatedBreaks });
                          }}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-white font-mono focus:outline-none focus:border-cyan-400 min-h-[38px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MANUAL OVERRIDE TOGGLE */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    Pool Availability Switch
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Toggle OFF to temporarily close the pool for cleaning or maintenance.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftSettings({ ...draftSettings, isOpenManually: !draftSettings.isOpenManually })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer flex-shrink-0 ${
                    draftSettings.isOpenManually ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      draftSettings.isOpenManually ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* NAMES & WARDEN PASSCODE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pool Title
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSettings.poolName}
                    onChange={(e) => setDraftSettings({ ...draftSettings, poolName: e.target.value })}
                    className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hostel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSettings.hostelName}
                    onChange={(e) => setDraftSettings({ ...draftSettings, hostelName: e.target.value })}
                    className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Warden Access Passcode
                </label>
                <input
                  type="password"
                  required
                  maxLength={32}
                  value={draftSettings.wardenPin}
                  onChange={(e) => setDraftSettings({ ...draftSettings, wardenPin: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  Current passcode: <strong>Ramesh1234</strong>. Change this anytime to update your access passcode.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full min-h-[50px] py-3.5 sm:py-4 px-5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-wait"
                >
                  {isSavingSettings ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Broadcasting to all devices...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save & Broadcast Settings to All Devices</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Clear Records Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-rose-800/80 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Clear All Student Records?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will permanently delete all {entries.length} student entry records from this device and all other phones.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isClearing ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
