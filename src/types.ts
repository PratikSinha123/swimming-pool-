export interface PoolEntry {
  id: string;
  name: string;
  roomNumber: string;
  studentId: string;
  phone: string;
  entryTimestamp: number;
  entryTimeFormatted: string;
  dateStr: string; // e.g. '2026-09-09'
}

export interface PoolSettings {
  poolName: string;
  hostelName: string;
  openTime: string;       // e.g. "06:00" (6:00 AM)
  closeTime: string;      // e.g. "17:30" (5:30 PM)
  isOpenManually: boolean; // Manual override: false if warden forcefully closes pool
  wardenPin: string;      // default "1234"
  googleSheetsWebhookUrl: string;
  appUrl: string;
}

export interface PoolOperatingStatus {
  isOpen: boolean;
  statusText: string;
  reason?: string;
  currentTimeFormatted: string;
  openTime12h: string;
  closeTime12h: string;
  timeUntilCloseMinutes?: number;
  timeUntilOpenMinutes?: number;
}
