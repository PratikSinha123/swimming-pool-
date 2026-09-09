import type { PoolOperatingStatus } from '../types';

/**
 * Converts 24h string ("17:30") to 12h string ("5:30 PM")
 */
export function format24To12(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Formats a Date or timestamp to "hh:mm A" (e.g., "08:35 AM")
 */
export function formatTimestampTime(timestamp: number | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Formats a Date or timestamp to "DD MMM YYYY, hh:mm A"
 */
export function formatTimestampFull(timestamp: number | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Evaluates pool open/closed status based on warden settings and current time
 */
export function checkPoolStatus(
  openTime24: string,
  closeTime24: string,
  isOpenManually: boolean,
  currentDate = new Date()
): PoolOperatingStatus {
  const openTime12h = format24To12(openTime24);
  const closeTime12h = format24To12(closeTime24);
  const currentTimeFormatted = formatTimestampTime(currentDate);

  if (!isOpenManually) {
    return {
      isOpen: false,
      statusText: 'Pool is Temporarily Closed',
      reason: 'The warden has temporarily closed the pool for maintenance or safety.',
      currentTimeFormatted,
      openTime12h,
      closeTime12h,
    };
  }

  const [openH, openM] = (openTime24 || '06:00').split(':').map(Number);
  const [closeH, closeM] = (closeTime24 || '17:30').split(':').map(Number);

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let isOpen = false;
  let timeUntilCloseMinutes = 0;
  let timeUntilOpenMinutes = 0;

  if (openMinutes <= closeMinutes) {
    // Normal daytime schedule (e.g., 06:00 to 17:30)
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      isOpen = true;
      timeUntilCloseMinutes = closeMinutes - currentMinutes;
    } else if (currentMinutes < openMinutes) {
      isOpen = false;
      timeUntilOpenMinutes = openMinutes - currentMinutes;
    } else {
      // past close time, opens tomorrow morning
      isOpen = false;
      timeUntilOpenMinutes = 24 * 60 - currentMinutes + openMinutes;
    }
  } else {
    // Overnight schedule (e.g., 20:00 to 02:00)
    if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
      isOpen = true;
      if (currentMinutes >= openMinutes) {
        timeUntilCloseMinutes = 24 * 60 - currentMinutes + closeMinutes;
      } else {
        timeUntilCloseMinutes = closeMinutes - currentMinutes;
      }
    } else {
      isOpen = false;
      timeUntilOpenMinutes = openMinutes - currentMinutes;
    }
  }

  const statusText = isOpen
    ? `Pool is Open (${openTime12h} – ${closeTime12h})`
    : `Pool is Closed (${openTime12h} – ${closeTime12h})`;

  const reason = !isOpen
    ? currentMinutes < openMinutes
      ? `Opens today at ${openTime12h}`
      : `Closed for today. Opens tomorrow at ${openTime12h}`
    : undefined;

  return {
    isOpen,
    statusText,
    reason,
    currentTimeFormatted,
    openTime12h,
    closeTime12h,
    timeUntilCloseMinutes,
    timeUntilOpenMinutes,
  };
}
