import React, { useState, useEffect } from 'react';
import type { PoolEntry, PoolSettings } from '../types';
import { format24To12 } from '../utils/timeUtils';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/googleSheets';
import {
  Shield,
  Clock,
  FileSpreadsheet,
  QrCode,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Copy,
  UserCheck,
  Calendar,
  RotateCw,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface WardenPanelProps {
  settings: PoolSettings;
  entries: PoolEntry[];
  onUpdateSettings: (newSettings: PoolSettings) => void;
  onClosePanel: () => void;
  onOpenQRPoster: () => void;
  onRefreshRecords: () => void;
  onLockWarden: () => void;
}

export const WardenPanel: React.FC<WardenPanelProps> = ({
  settings,
  entries,
  onUpdateSettings,
  onClosePanel,
  onOpenQRPoster,
  onRefreshRecords,
  onLockWarden,
}) => {
  // Tabs: 'records' | 'settings' | 'sheets'
  const [activeTab, setActiveTab] = useState<'records' | 'settings' | 'sheets'>('records');

  // Local settings draft form
  const [draftSettings, setDraftSettings] = useState<PoolSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep draft settings synced when settings are updated from cloud
  useEffect(() => {
    setDraftSettings({ ...settings });
  }, [settings]);

  // History search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Google Sheets copy status
  const [copiedCode, setCopiedCode] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayEntries = entries.filter((e) => e.dateStr === todayStr);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshRecords();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(draftSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
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
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Warden Administration Panel
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Authorized
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {settings.hostelName} • {settings.poolName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh latest entries from records"
          >
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenQRPoster}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Entrance QR Code</span>
          </button>
          <button
            onClick={onClosePanel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Switch to Student Entry form while keeping this device logged in"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Student Form</span>
          </button>
          <button
            onClick={onLockWarden}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl transition cursor-pointer"
            title="Sign out of this device (passcode will be required next time)"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out Device</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 px-4 sm:px-8 py-2 border-b border-slate-800 bg-slate-900/40 overflow-x-auto flex-shrink-0">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'records'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Student Entry Records ({entries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Operating Hours ({format24To12(settings.openTime)} – {format24To12(settings.closeTime)})</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'sheets'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google Sheets Sync</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl w-full mx-auto">
        {/* ========================================================
            TAB 1: STUDENT ENTRY RECORDS
            ======================================================== */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Entries */}
              <div className="bg-slate-900/90 border border-cyan-900/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Today's Entries</span>
                  <Calendar className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {todayEntries.length}{' '}
                  <span className="text-sm font-normal text-slate-400">recorded</span>
                </div>
                <span className="block text-[11px] text-emerald-400 mt-2">
                  Total all-time records: {entries.length}
                </span>
              </div>

              {/* Operating Hours */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Operating Hours</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      draftSettings.isOpenManually ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {draftSettings.isOpenManually ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {format24To12(settings.openTime)} – {format24To12(settings.closeTime)}
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="mt-2 text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  Change operating hours →
                </button>
              </div>

              {/* Google Sheets Status */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Google Sheets Sync</span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white tracking-tight mt-1">
                  {settings.googleSheetsWebhookUrl ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Connected
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5 text-sm font-semibold">
                      <AlertTriangle className="w-4 h-4" /> Ready to Link
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('sheets')}
                  className="mt-2 text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  Configure webhook →
                </button>
              </div>

              {/* Entrance QR Poster Card */}
              <div className="bg-slate-900/90 border border-cyan-800/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                  <span>Entrance QR Code</span>
                  <QrCode className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-lg font-bold text-white tracking-tight mt-1">
                  Entrance Poster
                </div>
                <button
                  onClick={onOpenQRPoster}
                  className="mt-2 text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  View & Print QR Poster →
                </button>
              </div>
            </div>

            {/* Entries Filter & Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    Student Swimming Pool Entry Log
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Records showing Student Name, Hostel Room No, Date, and Automatic Entry Time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-xl transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name or room number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      dateFilter === 'all'
                        ? 'bg-cyan-900 text-cyan-200'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Time ({entries.length})
                  </button>
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      dateFilter === 'today'
                        ? 'bg-cyan-900 text-cyan-200'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Today Only ({todayEntries.length})
                  </button>
                </div>
              </div>

              {/* Clean Table: Student Name, Room No, Date, Entry Time */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
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
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pool Operating Hours & Settings
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure daily opening and closing hours, titles, and warden security passcode.
              </p>
            </div>

            {settingsSaved && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Operating hours and pool settings have been saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
              {/* OPERATING HOURS */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Pool Daily Operating Hours
                  </span>
                  <span className="text-xs text-slate-400">
                    Currently: {format24To12(draftSettings.openTime)} to {format24To12(draftSettings.closeTime)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Opening Time (Morning)
                    </label>
                    <input
                      type="time"
                      required
                      value={draftSettings.openTime}
                      onChange={(e) => setDraftSettings({ ...draftSettings, openTime: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
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
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Meal Intervals (Pool Closed During Breaks)
                  </span>
                  <span className="text-xs text-slate-400">
                    Hostel Meal Schedule
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  The pool will automatically close during these intervals and reopen when the break ends. You can adjust times or toggle any break.
                </p>

                <div className="space-y-3">
                  {(draftSettings.mealBreaks || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${
                            item.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                              item.enabled ? 'translate-x-4' : 'translate-x-1'
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

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => {
                            const updatedBreaks = [...draftSettings.mealBreaks];
                            updatedBreaks[idx] = { ...item, startTime: e.target.value };
                            setDraftSettings({ ...draftSettings, mealBreaks: updatedBreaks });
                          }}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
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
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pool Title
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSettings.poolName}
                    onChange={(e) => setDraftSettings({ ...draftSettings, poolName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  Current passcode: <strong>Ramesh1234</strong>. Change this anytime to update your access passcode.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                >
                  Save Settings & Operating Hours
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: GOOGLE SHEETS SYNC
            ======================================================== */}
        {activeTab === 'sheets' && (
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Google Sheets Automatic Recording
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Every student entry automatically creates a new row in your Google Sheet with Name, Hostel Room No, and Automatic Time.
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 ${
                    draftSettings.googleSheetsWebhookUrl
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {draftSettings.googleSheetsWebhookUrl ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Webhook Active
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Not Configured
                    </>
                  )}
                </span>
              </div>

              {/* URL Input */}
              <div className="mb-6 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Google Apps Script Webhook URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={draftSettings.googleSheetsWebhookUrl}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, googleSheetsWebhookUrl: e.target.value })
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    onClick={() => {
                      onUpdateSettings(draftSettings);
                      alert('Google Sheets Webhook URL saved!');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save URL
                  </button>
                </div>
              </div>

              {/* Copy Script */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    Google Apps Script Code (Supports Entry Recording & Live Sync)
                  </span>
                  <button
                    onClick={handleCopyAppsScript}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Script Code
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto">
                  <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
                </div>
              </div>
            </div>

            {/* Guide */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3">
                📋 1-Minute Setup in Google Sheets:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                <li>Create a blank spreadsheet at <strong>sheets.new</strong>.</li>
                <li>Click <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
                <li>Clear any code, click <strong>Copy Script Code</strong> above, and paste it.</li>
                <li>Click <strong>Deploy</strong> (top right) → <strong>New deployment</strong>.</li>
                <li>Select type: <strong>Web app</strong>.</li>
                <li>Set: <em>Execute as:</em> <strong>Me</strong>, and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong>, copy the Web App URL, and paste it into the field above!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
