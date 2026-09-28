import {
  availableStarts,
  bookingEffect,
  checkFit,
  defaultStepMinutes,
  DurationConfig,
  freeMinutes,
  isFrozen,
  latestSummaryTime,
  maxConcurrent,
  nextSummaryTime,
  requiredMinutes,
  stockholmOffsetMinutes,
  stockholmTime,
  WindowShape,
} from '@service/interview-rules';

const t = (iso: string) => new Date(iso);
const iv = (start: string, end: string) => ({ startsAt: t(start), endsAt: t(end) });

const config = (overrides: Record<number, number> = {}): DurationConfig => ({
  defaultDurationMinutes: 15,
  maxDurationMinutes: 60,
  postDurations: new Map(Object.entries(overrides).map(([k, v]) => [Number(k), v])),
});

// 17:00-19:00 UTC, one interview at a time, no buffer
const window = (overrides: Partial<WindowShape> = {}): WindowShape => ({
  ...iv('2026-10-06T17:00:00Z', '2026-10-06T19:00:00Z'),
  bufferMinutes: 0,
  capacity: 1,
  stepMinutes: null,
  ...overrides,
});

describe('requiredMinutes', () => {
  it('sums interview posts', () => {
    expect(requiredMinutes(config(), [1, 2, 3])).toBe(45);
  });

  it('caps at the maximum', () => {
    expect(requiredMinutes(config(), [1, 2, 3, 4, 5])).toBe(60);
  });

  it('uses per-post overrides', () => {
    expect(requiredMinutes(config({ 2: 30 }), [1, 2])).toBe(45);
  });

  it('counts a post once', () => {
    expect(requiredMinutes(config(), [1, 1, 1])).toBe(15);
  });

  it('is zero without interview posts', () => {
    expect(requiredMinutes(config(), [])).toBe(0);
  });
});

describe('defaultStepMinutes', () => {
  it('equals the duration when all posts are equal and there is no buffer', () => {
    expect(defaultStepMinutes(config(), [1, 2], 0)).toBe(15);
  });

  it('shrinks to fit a buffer', () => {
    expect(defaultStepMinutes(config(), [1], 5)).toBe(5);
  });

  it('handles mixed durations', () => {
    expect(defaultStepMinutes(config({ 2: 20 }), [1, 2], 0)).toBe(5);
  });

  it('keeps a round buffer round', () => {
    expect(defaultStepMinutes(config(), [1], 15)).toBe(15);
  });

  it('falls back to the default duration without posts', () => {
    expect(defaultStepMinutes(config(), [], 0)).toBe(15);
  });
});

describe('maxConcurrent', () => {
  const range = iv('2026-10-06T17:00:00Z', '2026-10-06T18:00:00Z');

  it('treats back-to-back intervals as not overlapping', () => {
    const taken = [
      iv('2026-10-06T17:00:00Z', '2026-10-06T17:15:00Z'),
      iv('2026-10-06T17:15:00Z', '2026-10-06T17:30:00Z'),
    ];
    expect(maxConcurrent(range, taken)).toBe(1);
  });

  it('counts real overlaps', () => {
    const taken = [
      iv('2026-10-06T17:00:00Z', '2026-10-06T17:30:00Z'),
      iv('2026-10-06T17:10:00Z', '2026-10-06T17:20:00Z'),
      iv('2026-10-06T17:15:00Z', '2026-10-06T17:45:00Z'),
    ];
    expect(maxConcurrent(range, taken)).toBe(3);
  });

  it('ignores intervals outside the range', () => {
    expect(maxConcurrent(range, [iv('2026-10-06T18:00:00Z', '2026-10-06T18:30:00Z')])).toBe(0);
  });
});

describe('checkFit', () => {
  const at = (hm: string) => t(`2026-10-06T${hm}:00Z`);

  it('accepts an interview ending exactly at the window end', () => {
    expect(checkFit(window(), 15, at('18:00'), 60, [])).toEqual({ ok: true });
  });

  it('rejects an interview running past the window end', () => {
    expect(checkFit(window(), 15, at('18:15'), 60, [])).toEqual({
      ok: false,
      reason: 'OUTSIDE_WINDOW',
    });
  });

  it('rejects a start before the window', () => {
    expect(checkFit(window(), 15, at('16:45'), 15, []).ok).toBe(false);
  });

  it('rejects starts off the grid unless the grid is waived', () => {
    expect(checkFit(window(), 15, at('17:05'), 15, [])).toEqual({ ok: false, reason: 'OFF_GRID' });
    expect(checkFit(window(), 15, at('17:05'), 15, [], { requireGrid: false }).ok).toBe(true);
  });

  it('rejects starts inside the minimum notice', () => {
    expect(checkFit(window(), 15, at('17:00'), 15, [], { notBefore: at('17:01') })).toEqual({
      ok: false,
      reason: 'TOO_SOON',
    });
    expect(checkFit(window(), 15, at('17:00'), 15, [], { notBefore: at('17:00') }).ok).toBe(true);
  });

  it('allows back-to-back interviews without a buffer', () => {
    const taken = [iv('2026-10-06T17:00:00Z', '2026-10-06T17:15:00Z')];
    expect(checkFit(window(), 15, at('17:15'), 15, taken).ok).toBe(true);
  });

  it('blocks the buffer after an existing interview', () => {
    const taken = [iv('2026-10-06T17:00:00Z', '2026-10-06T17:15:00Z')];
    const w = window({ bufferMinutes: 5 });
    expect(checkFit(w, 5, at('17:15'), 15, taken)).toEqual({ ok: false, reason: 'FULL' });
    expect(checkFit(w, 5, at('17:20'), 15, taken).ok).toBe(true);
  });

  it('blocks a start whose own buffer runs into the next interview', () => {
    const taken = [iv('2026-10-06T17:20:00Z', '2026-10-06T17:35:00Z')];
    const w = window({ bufferMinutes: 5 });
    expect(checkFit(w, 5, at('17:05'), 15, taken)).toEqual({ ok: false, reason: 'FULL' });
    expect(checkFit(w, 5, at('17:00'), 15, taken).ok).toBe(true);
  });

  it('allows a trailing buffer past the window end', () => {
    expect(checkFit(window({ bufferMinutes: 10 }), 5, at('18:45'), 15, []).ok).toBe(true);
  });

  it('allows parallel interviews up to capacity', () => {
    const w = window({ capacity: 2 });
    const one = [iv('2026-10-06T17:00:00Z', '2026-10-06T17:30:00Z')];
    const two = [...one, iv('2026-10-06T17:15:00Z', '2026-10-06T17:45:00Z')];
    expect(checkFit(w, 15, at('17:15'), 15, one).ok).toBe(true);
    expect(checkFit(w, 15, at('17:15'), 15, two)).toEqual({ ok: false, reason: 'FULL' });
    // Only one of the two is still running at 17:30
    expect(checkFit(w, 15, at('17:30'), 15, two).ok).toBe(true);
  });

  it('rejects a zero length interview', () => {
    expect(checkFit(window(), 15, at('17:00'), 0, []).ok).toBe(false);
  });
});

describe('availableStarts', () => {
  it('lists grid starts that fit the length', () => {
    const starts = availableStarts(window(), 15, 60, []);
    expect(starts.map((d) => d.toISOString().slice(11, 16))).toEqual([
      '17:00',
      '17:15',
      '17:30',
      '17:45',
      '18:00',
    ]);
  });

  it('skips taken time', () => {
    const taken = [iv('2026-10-06T17:30:00Z', '2026-10-06T18:30:00Z')];
    const starts = availableStarts(window(), 15, 30, taken);
    expect(starts.map((d) => d.toISOString().slice(11, 16))).toEqual(['17:00', '18:30']);
  });

  it('can offer a short slot when a long one does not fit', () => {
    const taken = [iv('2026-10-06T17:15:00Z', '2026-10-06T19:00:00Z')];
    expect(availableStarts(window(), 15, 15, taken)).toHaveLength(1);
    expect(availableStarts(window(), 15, 60, taken)).toHaveLength(0);
  });
});

describe('freeMinutes', () => {
  it('multiplies by capacity and subtracts bookings with buffers', () => {
    const taken = [iv('2026-10-06T17:00:00Z', '2026-10-06T17:30:00Z')];
    expect(freeMinutes(window({ capacity: 2, bufferMinutes: 10 }), taken)).toBe(240 - 40);
  });

  it('does not count a trailing buffer outside the window', () => {
    const taken = [iv('2026-10-06T18:30:00Z', '2026-10-06T19:00:00Z')];
    expect(freeMinutes(window({ bufferMinutes: 10 }), taken)).toBe(90);
  });
});

describe('isFrozen', () => {
  const freezeAt = t('2026-10-10T12:00:00Z');

  it('freezes at the exact freeze instant', () => {
    expect(isFrozen({ freezeAt, frozen: false }, t('2026-10-10T11:59:59.999Z'))).toBe(false);
    expect(isFrozen({ freezeAt, frozen: false }, freezeAt)).toBe(true);
  });

  it('can be frozen manually without a date', () => {
    expect(isFrozen({ freezeAt: null, frozen: true }, t('2026-01-01T00:00:00Z'))).toBe(true);
    expect(isFrozen({ freezeAt: null, frozen: false }, t('2030-01-01T00:00:00Z'))).toBe(false);
  });
});

describe('bookingEffect', () => {
  const booking30 = iv('2026-10-06T17:00:00Z', '2026-10-06T17:30:00Z');
  const booking60 = iv('2026-10-06T17:00:00Z', '2026-10-06T18:00:00Z');
  const effect = (
    before: number[],
    after: number[],
    booking: typeof booking30 | null = booking30,
    frozen = false,
    c = config(),
  ) => bookingEffect({ booking, frozen, config: c, before, after });

  it('does nothing without a booking', () => {
    expect(effect([1], [1, 2], null)).toBe('NONE');
  });

  it('does nothing when the interview posts are unchanged (re-sent answer)', () => {
    expect(effect([1, 2], [2, 1])).toBe('NONE');
  });

  it('unbooks when accepting makes the interview longer', () => {
    expect(effect([1, 2], [1, 2, 3])).toBe('UNBOOKED');
  });

  it('keeps the booking when accepting at the maximum length', () => {
    expect(effect([1, 2, 3, 4], [1, 2, 3, 4, 5], booking60)).toBe('KEPT_POST_ADDED');
  });

  it('shortens the booking when declining one of several posts', () => {
    expect(effect([1, 2], [1])).toBe('SHORTENED');
  });

  it('keeps the booking when declining still needs the maximum length', () => {
    expect(effect([1, 2, 3, 4, 5], [1, 2, 3, 4], booking60)).toBe('KEPT_POST_REMOVED');
  });

  it('shortens from the maximum when declining drops below it', () => {
    expect(effect([1, 2, 3, 4], [1, 2, 3], booking60)).toBe('SHORTENED');
  });

  it('keeps the booking on decline even if durations were raised since booking', () => {
    expect(effect([1, 2], [1], booking30, false, config({ 1: 45 }))).toBe('KEPT_POST_REMOVED');
  });

  it('shortens when accepting needs less time than booked, e.g. after durations were lowered', () => {
    expect(effect([1], [1, 2], booking60)).toBe('SHORTENED');
  });

  it('does not shorten after the freeze', () => {
    expect(effect([1, 2], [1], booking30, true)).toBe('FLAGGED');
  });

  it('frees the booking when the last interview post is declined', () => {
    expect(effect([1], [])).toBe('FREED');
  });

  it('frees the booking on full withdrawal even after the freeze', () => {
    expect(effect([1, 2], [], booking30, true)).toBe('FREED');
  });

  it('flags instead of unbooking after the freeze', () => {
    expect(effect([1, 2], [1, 2, 3], booking30, true)).toBe('FLAGGED');
    expect(effect([1, 2], [1], booking30, true)).toBe('FLAGGED');
  });

  it('treats an accept-and-decline swap as an accept', () => {
    expect(effect([1, 2], [1, 3])).toBe('KEPT_POST_ADDED');
    expect(effect([1, 2], [1, 3], booking30, false, config({ 3: 30 }))).toBe('UNBOOKED');
  });
});

describe('Stockholm time', () => {
  it('knows winter and summer offsets', () => {
    expect(stockholmOffsetMinutes(t('2026-01-15T12:00:00Z'))).toBe(60);
    expect(stockholmOffsetMinutes(t('2026-07-15T12:00:00Z'))).toBe(120);
  });

  it('converts wall-clock times on either side of daylight saving', () => {
    expect(stockholmTime(t('2026-07-15T12:00:00Z'), 17, 15).toISOString()).toBe(
      '2026-07-15T15:15:00.000Z',
    );
    expect(stockholmTime(t('2026-12-15T12:00:00Z'), 17, 15).toISOString()).toBe(
      '2026-12-15T16:15:00.000Z',
    );
  });

  it('handles the days daylight saving starts and ends', () => {
    expect(stockholmTime(t('2026-03-29T12:00:00Z'), 17, 15).toISOString()).toBe(
      '2026-03-29T15:15:00.000Z',
    );
    expect(stockholmTime(t('2026-10-25T12:00:00Z'), 17, 15).toISOString()).toBe(
      '2026-10-25T16:15:00.000Z',
    );
  });

  it('uses the Stockholm calendar day, not the UTC one', () => {
    // 23:30 UTC on 14 July is already 15 July in Stockholm
    expect(stockholmTime(t('2026-07-14T23:30:00Z'), 17, 15).toISOString()).toBe(
      '2026-07-15T15:15:00.000Z',
    );
  });
});

describe('summary times', () => {
  it('finds the latest and next 17:15 around the boundary', () => {
    const summerSummary = t('2026-07-15T15:15:00Z');
    expect(latestSummaryTime(summerSummary)).toEqual(summerSummary);
    expect(latestSummaryTime(t('2026-07-15T15:14:59Z'))).toEqual(t('2026-07-14T15:15:00Z'));
    expect(nextSummaryTime(summerSummary)).toEqual(t('2026-07-16T15:15:00Z'));
    expect(nextSummaryTime(t('2026-07-15T15:14:59Z'))).toEqual(summerSummary);
  });

  it('steps across the end of daylight saving', () => {
    // 24 Oct 17:15 is summer time, 25 Oct 17:15 is winter time
    expect(nextSummaryTime(t('2026-10-24T15:15:00Z'))).toEqual(t('2026-10-25T16:15:00Z'));
    expect(latestSummaryTime(t('2026-10-25T16:00:00Z'))).toEqual(t('2026-10-24T15:15:00Z'));
  });
});
