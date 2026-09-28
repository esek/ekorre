/**
 * Pure rules for interview booking. Nothing here touches the database, so every rule
 * can be unit tested in isolation. Times are plain `Date`s (UTC instants).
 */

const MINUTE = 60_000;

export type Interval = { startsAt: Date; endsAt: Date };

export type WindowShape = Interval & {
  bufferMinutes: number;
  capacity: number;
  stepMinutes: number | null;
};

export type DurationConfig = {
  defaultDurationMinutes: number;
  maxDurationMinutes: number;
  /** Per-post overrides, keyed by post id */
  postDurations: ReadonlyMap<number, number>;
};

export const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * MINUTE);

export const minutesBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / MINUTE);

export const durationForPost = (config: DurationConfig, postId: number) =>
  config.postDurations.get(postId) ?? config.defaultDurationMinutes;

/**
 * Combined interview length for a set of accepted interview posts: the sum of their
 * durations, capped at the maximum. Zero means no interview is needed.
 */
export const requiredMinutes = (config: DurationConfig, interviewPostIds: readonly number[]) => {
  const sum = [...new Set(interviewPostIds)].reduce(
    (acc, postId) => acc + durationForPost(config, postId),
    0,
  );
  return Math.min(sum, config.maxDurationMinutes);
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Default start-time step for a window: the largest step that every per-post duration
 * and the buffer are multiples of. With 15 minute posts and no buffer this is 15.
 */
export const defaultStepMinutes = (
  config: DurationConfig,
  interviewPostIds: readonly number[],
  bufferMinutes: number,
) => {
  const durations = interviewPostIds.length
    ? interviewPostIds.map((id) => durationForPost(config, id))
    : [config.defaultDurationMinutes];
  const step = [...durations, bufferMinutes].filter((n) => n > 0).reduce(gcd, 0);
  return step > 0 ? step : 5;
};

/** The time a booking blocks in its window: the interview plus the buffer after it */
const occupied = (i: Interval, bufferMinutes: number): Interval => ({
  startsAt: i.startsAt,
  endsAt: addMinutes(i.endsAt, bufferMinutes),
});

const overlaps = (a: Interval, b: Interval) => a.startsAt < b.endsAt && b.startsAt < a.endsAt;

/**
 * Largest number of `taken` intervals that overlap at any single instant inside `range`.
 * Intervals are half-open, so one ending exactly when another starts does not overlap.
 */
export const maxConcurrent = (range: Interval, taken: readonly Interval[]) => {
  const events: [number, number][] = [];
  for (const t of taken) {
    if (!overlaps(range, t)) continue;
    const start = Math.max(t.startsAt.getTime(), range.startsAt.getTime());
    const end = Math.min(t.endsAt.getTime(), range.endsAt.getTime());
    events.push([start, 1], [end, -1]);
  }
  // Ends before starts at the same instant, since intervals are half-open
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let current = 0;
  let max = 0;
  for (const [, delta] of events) {
    current += delta;
    max = Math.max(max, current);
  }
  return max;
};

export type FitOptions = {
  /** Earliest allowed start, e.g. now + minimum notice. Omit to allow any start */
  notBefore?: Date;
  /** Enforce the start-time grid. Admin requests may pick any minute */
  requireGrid?: boolean;
};

export type FitResult =
  | { ok: true }
  | { ok: false; reason: 'OUTSIDE_WINDOW' | 'OFF_GRID' | 'TOO_SOON' | 'FULL' };

/**
 * Whether an interview of `lengthMinutes` starting at `startsAt` fits in the window,
 * given the intervals already taken in it (bookings and pending requests).
 */
export const checkFit = (
  window: WindowShape,
  step: number,
  startsAt: Date,
  lengthMinutes: number,
  taken: readonly Interval[],
  options: FitOptions = {},
): FitResult => {
  const endsAt = addMinutes(startsAt, lengthMinutes);
  if (lengthMinutes <= 0 || startsAt < window.startsAt || endsAt > window.endsAt) {
    return { ok: false, reason: 'OUTSIDE_WINDOW' };
  }
  if ((options.requireGrid ?? true) && minutesBetween(window.startsAt, startsAt) % step !== 0) {
    return { ok: false, reason: 'OFF_GRID' };
  }
  if (options.notBefore && startsAt < options.notBefore) {
    return { ok: false, reason: 'TOO_SOON' };
  }

  const candidate = occupied({ startsAt, endsAt }, window.bufferMinutes);
  const others = taken.map((t) => occupied(t, window.bufferMinutes));
  if (maxConcurrent(candidate, others) + 1 > window.capacity) {
    return { ok: false, reason: 'FULL' };
  }
  return { ok: true };
};

/** Every start time in the window where an interview of `lengthMinutes` fits */
export const availableStarts = (
  window: WindowShape,
  step: number,
  lengthMinutes: number,
  taken: readonly Interval[],
  options: FitOptions = {},
): Date[] => {
  const starts: Date[] = [];
  for (
    let t = window.startsAt;
    addMinutes(t, lengthMinutes) <= window.endsAt;
    t = addMinutes(t, step)
  ) {
    if (checkFit(window, step, t, lengthMinutes, taken, { ...options, requireGrid: false }).ok) {
      starts.push(t);
    }
  }
  return starts;
};

/** Total bookable minutes left in a window: free capacity-minutes, ignoring the grid */
export const freeMinutes = (window: WindowShape, taken: readonly Interval[]) => {
  const inWindow = taken
    .map((t) => occupied(t, window.bufferMinutes))
    .filter((t) => overlaps(window, t));
  const used = inWindow.reduce((acc, t) => {
    const start = Math.max(t.startsAt.getTime(), window.startsAt.getTime());
    const end = Math.min(t.endsAt.getTime(), window.endsAt.getTime());
    return acc + (end - start) / MINUTE;
  }, 0);
  return Math.max(0, minutesBetween(window.startsAt, window.endsAt) * window.capacity - used);
};

export type FreezeState = { freezeAt: Date | null; frozen: boolean };

export const isFrozen = (settings: FreezeState, now: Date) =>
  settings.frozen || (settings.freezeAt !== null && now >= settings.freezeAt);

/**
 * What happens to an existing booking when a nominee's accepted interview posts change.
 *
 * - NONE: nothing changes (no booking, or the interview posts are the same)
 * - KEPT_POST_ADDED: accepted a post, but the booking already has the length needed
 * - KEPT_POST_REMOVED: declined a post, but the length needed is unchanged (e.g. at the
 *   maximum), or longer because durations were raised after booking; the booking stays
 * - SHORTENED: the interview needs less time; the booking keeps its start and ends
 *   earlier. Shrinking never collides with other bookings, it only frees time
 * - UNBOOKED: accepted a post that needs a longer interview; the booking is removed
 * - FREED: no interview posts left; the booking is removed
 * - FLAGGED: after the freeze; the booking stays and the committee is told
 */
export type BookingEffect =
  | 'NONE'
  | 'KEPT_POST_ADDED'
  | 'KEPT_POST_REMOVED'
  | 'SHORTENED'
  | 'UNBOOKED'
  | 'FREED'
  | 'FLAGGED';

export const bookingEffect = (input: {
  booking: Interval | null;
  frozen: boolean;
  config: DurationConfig;
  before: readonly number[];
  after: readonly number[];
}): BookingEffect => {
  const { booking, frozen, config } = input;
  const before = new Set(input.before);
  const after = new Set(input.after);
  const same = before.size === after.size && [...before].every((p) => after.has(p));

  if (!booking || same) return 'NONE';
  if (after.size === 0) return 'FREED';
  if (frozen) return 'FLAGGED';

  const added = [...after].some((p) => !before.has(p));
  const booked = minutesBetween(booking.startsAt, booking.endsAt);
  const required = requiredMinutes(config, [...after]);

  // Declining never removes a booking; only accepting can need more time than booked
  if (added && required > booked) return 'UNBOOKED';
  if (required < booked) return 'SHORTENED';
  return added ? 'KEPT_POST_ADDED' : 'KEPT_POST_REMOVED';
};

/** Minutes Stockholm is ahead of UTC at the given instant (60 in winter, 120 in summer) */
export const stockholmOffsetMinutes = (at: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - at.getTime()) / MINUTE);
};

/**
 * The UTC instant of a wall-clock time in Europe/Stockholm on the calendar day that
 * contains `day` there. Handles summer and winter time.
 */
export const stockholmTime = (day: Date, hour: number, minute: number): Date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(day);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const [y, m, d] = [get('year'), get('month'), get('day')];

  // Guess assuming UTC, then correct by Stockholm's offset at that instant. A second pass
  // settles the rare case where the correction crosses a daylight saving change.
  let guess = Date.UTC(y, m - 1, d, hour, minute);
  for (let i = 0; i < 2; i += 1) {
    guess = Date.UTC(y, m - 1, d, hour, minute) - stockholmOffsetMinutes(new Date(guess)) * MINUTE;
  }
  return new Date(guess);
};

export const SUMMARY_HOUR = 17;
export const SUMMARY_MINUTE = 15;

/** The most recent 17:15 Stockholm time at or before `now` */
export const latestSummaryTime = (now: Date) => {
  const today = stockholmTime(now, SUMMARY_HOUR, SUMMARY_MINUTE);
  return today <= now
    ? today
    : stockholmTime(addMinutes(today, -24 * 60), SUMMARY_HOUR, SUMMARY_MINUTE);
};

/** The next 17:15 Stockholm time strictly after `now` */
export const nextSummaryTime = (now: Date) => {
  const today = stockholmTime(now, SUMMARY_HOUR, SUMMARY_MINUTE);
  return today > now
    ? today
    : stockholmTime(addMinutes(today, 24 * 60), SUMMARY_HOUR, SUMMARY_MINUTE);
};
