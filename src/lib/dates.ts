const LAGOS = "Africa/Lagos";

export const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LAGOS,
});

export const shortDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: LAGOS,
});

export const timeLabel = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: LAGOS,
});

export const dateTimeLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: LAGOS,
});

export const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: LAGOS,
});

/** "25–28 February 2027", the way the camp is advertised. */
export function campDateRange(start: Date, end: Date) {
  const startDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: LAGOS }).format(start);
  const endDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: LAGOS }).format(end);
  const monthYear = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: LAGOS,
  }).format(end);
  return `${startDay}–${endDay} ${monthYear}`;
}

export function daysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

/** YYYY-MM-DD in Lagos time, the value a <input type="date"> expects. */
export function toDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: LAGOS,
  }).format(date);
}

export function relativeFromNow(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const absMinutes = Math.abs(diffMinutes);
  if (absMinutes < 60) return formatter.format(diffMinutes, "minute");
  if (absMinutes < 60 * 24) return formatter.format(Math.round(diffMinutes / 60), "hour");
  return formatter.format(Math.round(diffMinutes / (60 * 24)), "day");
}
