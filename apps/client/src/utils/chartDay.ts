/** Normalize a DB/API day value to YYYY-MM-DD for chart labels and bucketing. */
export function toDayKey(day: string | Date): string {
  if (day instanceof Date) {
    return day.toISOString().slice(0, 10);
  }
  const raw = String(day);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return raw.slice(0, 10);
}

/** Short chart axis label (MM-DD) from a day key. */
export function chartDayLabel(day: string | Date): string {
  return toDayKey(day).slice(5, 10);
}
