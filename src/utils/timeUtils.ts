import type { PoolOperatingStatus, MealBreak } from '../types';

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
 * Evaluates pool open/closed status based on:
 * 1. Manual warden override
 * 2. General operating hours (e.g. 06:00 to 22:30 / 6:00 AM to 10:30 PM)
 * 3. Meal break intervals (Breakfast, Lunch, Evening Snacks, Night Dinner)
 */
export function checkPoolStatus(
  openTime24: string,
  closeTime24: string,
  isOpenManually: boolean,
  mealBreaks: MealBreak[] = [],
  currentDate = new Date()
): PoolOperatingStatus {
  const openTime12h = format24To12(openTime24 || '06:00');
  const closeTime12h = format24To12(closeTime24 || '22:30');
  const currentTimeFormatted = formatTimestampTime(currentDate);

  // 1. Manual override check
  if (!isOpenManually) {
    return {
      isOpen: false,
      statusText: 'Pool is Temporarily Closed',
      reason: 'The pool is currently closed for maintenance or safety.',
      currentTimeFormatted,
      openTime12h,
      closeTime12h,
    };
  }

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const [openH, openM] = (openTime24 || '06:00').split(':').map(Number);
  const [closeH, closeM] = (closeTime24 || '22:30').split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // 2. Check general pool hours (6:00 AM to 10:30 PM)
  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: `Pool is Closed (Hours: ${openTime12h} – ${closeTime12h})`,
      reason: `Opens today at ${openTime12h}.`,
      currentTimeFormatted,
      openTime12h,
      closeTime12h,
    };
  }

  if (currentMinutes >= closeMinutes) {
    return {
      isOpen: false,
      statusText: `Pool is Closed for the Night`,
      reason: `Closed at ${closeTime12h}. Next session opens tomorrow at ${openTime12h}.`,
      currentTimeFormatted,
      openTime12h,
      closeTime12h,
    };
  }

  // 3. Check Meal Breaks / Intervals
  const activeBreaks = (mealBreaks || []).filter((b) => b.enabled);
  for (const b of activeBreaks) {
    const [bStartH, bStartM] = b.startTime.split(':').map(Number);
    const [bEndH, bEndM] = b.endTime.split(':').map(Number);
    const bStartMin = bStartH * 60 + bStartM;
    const bEndMin = bEndH * 60 + bEndM;

    if (currentMinutes >= bStartMin && currentMinutes < bEndMin) {
      const bEnd12 = format24To12(b.endTime);
      return {
        isOpen: false,
        statusText: `Closed for ${b.name}`,
        reason: `Pool is closed for ${b.name} (${format24To12(b.startTime)} – ${bEnd12}). Reopens at ${bEnd12}.`,
        currentTimeFormatted,
        openTime12h,
        closeTime12h,
        currentBreakName: b.name,
      };
    }
  }

  // 4. Find next upcoming break or closing
  let nextEventText = `Closes at ${closeTime12h}`;
  const upcomingBreaks = activeBreaks
    .map((b) => {
      const [h, m] = b.startTime.split(':').map(Number);
      return { ...b, startMin: h * 60 + m };
    })
    .filter((b) => b.startMin > currentMinutes)
    .sort((a, b) => a.startMin - b.startMin);

  if (upcomingBreaks.length > 0) {
    const nextB = upcomingBreaks[0];
    nextEventText = `Next break: ${nextB.name} at ${format24To12(nextB.startTime)}`;
  }

  return {
    isOpen: true,
    statusText: `Pool is Open (${openTime12h} – ${closeTime12h})`,
    reason: undefined,
    currentTimeFormatted,
    openTime12h,
    closeTime12h,
    nextEventText,
  };
}
