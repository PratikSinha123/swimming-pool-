export interface PoolEntry {
  id: string;
  name: string;
  roomNumber: string;
  entryTimestamp: number;
  entryTimeFormatted: string;
  dateStr: string; // e.g. '2026-09-09'
  isMealBreakEntry?: boolean;
  entryNotice?: string;
}

export interface MealBreak {
  id: string;
  name: string;
  startTime: string; // 24h format e.g. "07:30"
  endTime: string;   // 24h format e.g. "09:00"
  enabled: boolean;
}

export interface PoolSettings {
  poolName: string;
  hostelName: string;
  openTime: string;       // default "06:00" (6:00 AM)
  closeTime: string;      // default "22:30" (10:30 PM)
  isOpenManually: boolean; // Manual override: false if warden forcefully closes pool
  strictBlockDuringClosures?: boolean; // false by default: allows entries with notice
  wardenPin: string;      // default "Ramesh1234"
  googleSheetsWebhookUrl: string;
  appUrl: string;
  mealBreaks: MealBreak[];
}

export interface PoolOperatingStatus {
  isOpen: boolean;
  statusText: string;
  reason?: string;
  currentTimeFormatted: string;
  openTime12h: string;
  closeTime12h: string;
  currentBreakName?: string;
  nextEventText?: string;
}
