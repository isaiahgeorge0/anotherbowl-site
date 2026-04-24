/**
 * Café collection windows — edit `WEEKLY_HOURS` to change opening times.
 * Times are interpreted in `BUSINESS_TIMEZONE` (default Europe/London).
 * Slot step: 15 minutes.
 */

export const BUSINESS_TIMEZONE = 'Europe/London';

/** 0 = Sunday … 6 = Saturday (JavaScript Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DaySchedule = { open: string; close: string } | { closed: true };

/**
 * Weekly hours (local wall clock in BUSINESS_TIMEZONE).
 * Set `{ closed: true }` for a closed day.
 */
export const WEEKLY_HOURS: Record<Weekday, DaySchedule> = {
  0: { closed: true }, // Sunday
  1: { open: '08:00', close: '16:00' },
  2: { open: '08:00', close: '16:00' },
  3: { open: '08:00', close: '16:00' },
  4: { open: '08:00', close: '16:00' },
  5: { open: '08:00', close: '17:00' },
  6: { open: '09:00', close: '16:00' },
};

const SLOT_MINUTES = 15;
/** Minimum lead time from "now" before the next available slot (same day). */
const LEAD_TIME_MINUTES = 20;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function generateRawSlots(open: string, close: string): string[] {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];
  const out: string[] = [];
  for (let t = start; t < end; t += SLOT_MINUTES) {
    out.push(minutesToTime(t));
  }
  return out;
}

/** YYYY-MM-DD in BUSINESS_TIMEZONE for the given instant. */
export function getCalendarDateInBusinessZone(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function parseWeekdayFromLongName(name: string | undefined): Weekday | null {
  if (!name) return null;
  const map: Record<string, Weekday> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[name] ?? null;
}

/** Weekday 0–6 in BUSINESS_TIMEZONE for the given instant. */
export function getWeekdayInBusinessZone(d: Date = new Date()): Weekday {
  const long = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'long',
  }).format(d);
  return parseWeekdayFromLongName(long) ?? ((d.getUTCDay() as number) as Weekday);
}

/** "Now" as minutes-since-midnight in BUSINESS_TIMEZONE. */
export function getNowMinutesInBusinessZone(d: Date = new Date()): number {
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hour = Number(hm.find((p) => p.type === 'hour')?.value);
  const minute = Number(hm.find((p) => p.type === 'minute')?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

export type CollectionSlotsResult = {
  slots: string[];
  dayClosed: boolean;
  noSlotsLeftToday: boolean;
  message: string | null;
};

/**
 * Returns valid collection time strings (HH:mm) for the given instant's calendar day
 * in BUSINESS_TIMEZONE. Filters out past slots if that day is "today" there.
 */
export function getCollectionSlotsForReferenceNow(reference: Date = new Date()): CollectionSlotsResult {
  const weekday = getWeekdayInBusinessZone(reference);
  const sched = WEEKLY_HOURS[weekday];

  if ('closed' in sched && sched.closed) {
    return {
      slots: [],
      dayClosed: true,
      noSlotsLeftToday: false,
      message: 'We are closed today. Please try another day.',
    };
  }

  if (!('open' in sched)) {
    return {
      slots: [],
      dayClosed: true,
      noSlotsLeftToday: false,
      message: 'We are closed today. Please try another day.',
    };
  }

  const { open, close } = sched;
  let slots = generateRawSlots(open, close);
  if (slots.length === 0) {
    return {
      slots: [],
      dayClosed: false,
      noSlotsLeftToday: false,
      message: 'No collection times are configured for today.',
    };
  }

  const now = new Date();
  const sameCalendarDayAsNow =
    getCalendarDateInBusinessZone(reference) === getCalendarDateInBusinessZone(now);
  if (sameCalendarDayAsNow) {
    const nowM = getNowMinutesInBusinessZone(now);
    const minAllowed = nowM + LEAD_TIME_MINUTES;
    const rounded = Math.ceil(minAllowed / SLOT_MINUTES) * SLOT_MINUTES;
    slots = slots.filter((s) => timeToMinutes(s) >= rounded);
  }

  if (slots.length === 0) {
    return {
      slots: [],
      dayClosed: false,
      noSlotsLeftToday: true,
      message: 'No more collection slots are available for today. Please try again when we are open.',
    };
  }

  return {
    slots,
    dayClosed: false,
    noSlotsLeftToday: false,
    message: null,
  };
}

export function isValidCollectionTime(
  time: string,
  reference: Date = new Date()
): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const { slots } = getCollectionSlotsForReferenceNow(reference);
  return slots.includes(time);
}

/** Server should use this with `new Date()` at request time (same calendar day as customer for same-day collection). */
export function isValidCollectionTimeForOrderNow(time: string | undefined): boolean {
  if (!time?.trim()) return false;
  return isValidCollectionTime(time, new Date());
}

/**
 * When false, the shop is not accepting public online orders (e.g. closed day, no slots left today, or unconfigured day).
 * Same check drives collection slot availability and blocking table orders while closed.
 */
export function isShopOpenForPublicOrderingNow(reference: Date = new Date()): boolean {
  return getCollectionSlotsForReferenceNow(reference).slots.length > 0;
}

export function getPublicOrderingClosedMessage(
  reference: Date = new Date()
): string {
  const r = getCollectionSlotsForReferenceNow(reference);
  if (r.slots.length > 0) {
    return '';
  }
  return r.message?.trim() || 'Online ordering is not available right now. Please try again when we are open.';
}
