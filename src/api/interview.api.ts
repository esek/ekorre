import { BadRequestError, ForbiddenError, NotFoundError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import {
  Prisma,
  PrismaInterviewBooking,
  PrismaInterviewRequest,
  PrismaInterviewRequestStatus,
  PrismaInterviewSettings,
  PrismaInterviewWindow,
  PrismaNominationAnswer,
} from '@prisma/client';
import {
  addMinutes,
  availableStarts,
  BookingEffect,
  bookingEffect,
  checkFit,
  defaultStepMinutes,
  DurationConfig,
  FitResult,
  freeMinutes,
  Interval,
  isFrozen,
  maxConcurrent,
  minutesBetween,
  requiredMinutes,
} from '@service/interview-rules';

import prisma from './prisma';

const logger = Logger.getLogger('InterviewAPI');

type Tx = Prisma.TransactionClient;

/** Settings as stored, or the defaults when an election has none yet */
export type InterviewSettings = Omit<PrismaInterviewSettings, 'refElection'> & {
  refElection: number;
};

export const DEFAULT_SETTINGS: Omit<InterviewSettings, 'refElection'> = {
  defaultDurationMinutes: 15,
  maxDurationMinutes: 60,
  minNoticeMinutes: 24 * 60,
  freezeAt: null,
  frozen: false,
  notifyEmails: ['vbordforande@esek.se', 'vbsekreterare@esek.se'],
  lastSummarySentAt: null,
};

export type WindowInput = {
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  videoLink?: string | null;
  bufferMinutes?: number;
  capacity?: number;
  stepMinutes?: number | null;
};

export type SettingsInput = Partial<
  Pick<
    InterviewSettings,
    | 'defaultDurationMinutes'
    | 'maxDurationMinutes'
    | 'minNoticeMinutes'
    | 'freezeAt'
    | 'frozen'
    | 'notifyEmails'
  >
>;

export type WindowAvailability = {
  window: PrismaInterviewWindow;
  starts: Date[];
};

/** What a nomination answer would do, or did, to the nominee's booking and request */
export type NominationOutcome = {
  effect: BookingEffect;
  requiredMinutesBefore: number;
  requiredMinutesAfter: number;
  booking: PrismaInterviewBooking | null;
  /** A pending admin request that no longer matches the nominee's length */
  withdrawnRequest: PrismaInterviewRequest | null;
};

export type MissingView = {
  unbooked: { username: string; requiredMinutes: number }[];
  minutesNeeded: number;
  minutesAvailable: number;
  /** Booked shorter than the nominee now needs */
  tooShort: { booking: PrismaInterviewBooking; requiredMinutes: number }[];
  /** No window, or outside its window */
  outsideWindow: PrismaInterviewBooking[];
  /** In a window that now has more parallel interviews than its capacity */
  overCapacity: PrismaInterviewBooking[];
  /** Nomination answers changed after the freeze */
  needsAttention: PrismaInterviewBooking[];
};

const assertPositiveInt = (value: number | undefined | null, name: string, allowZero = false) => {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new BadRequestError(`${name} måste vara ett heltal ${allowZero ? '≥ 0' : '≥ 1'}`);
  }
};

const fitMessage = (fit: FitResult) => {
  if (fit.ok) return '';
  switch (fit.reason) {
    case 'OUTSIDE_WINDOW':
      return 'Tiden ligger utanför intervjufönstret';
    case 'OFF_GRID':
      return 'Tiden är inte en av de tillgängliga starttiderna';
    case 'TOO_SOON':
      return 'Tiden ligger för nära i tiden för att bokas';
    case 'FULL':
    default:
      return 'Tiden är redan bokad';
  }
};

export class InterviewAPI {
  // ---------------------------------------------------------------------------
  // Settings and durations
  // ---------------------------------------------------------------------------

  async getSettings(electionId: number, client: Tx = prisma): Promise<InterviewSettings> {
    const s = await client.prismaInterviewSettings.findUnique({
      where: { refElection: electionId },
    });
    return s ?? { ...DEFAULT_SETTINGS, refElection: electionId };
  }

  async updateSettings(electionId: number, input: SettingsInput): Promise<InterviewSettings> {
    assertPositiveInt(input.defaultDurationMinutes, 'Längd per post');
    assertPositiveInt(input.maxDurationMinutes, 'Maxlängd');
    assertPositiveInt(input.minNoticeMinutes, 'Framförhållning', true);
    if (input.notifyEmails && input.notifyEmails.length === 0) {
      throw new BadRequestError('Minst en mottagare krävs');
    }

    await this.assertElectionExists(electionId);

    return prisma.prismaInterviewSettings.upsert({
      where: { refElection: electionId },
      create: { refElection: electionId, ...input },
      update: input,
    });
  }

  /** Sets a post's interview length in this election, or resets it to the default */
  async setPostDuration(electionId: number, postId: number, minutes: number | null) {
    if (minutes === null) {
      await prisma.prismaInterviewPostDuration.deleteMany({
        where: { refElection: electionId, refPost: postId },
      });
      return true;
    }

    assertPositiveInt(minutes, 'Längd');
    const electable = await prisma.prismaElectable.findUnique({
      where: { refElection_refPost: { refElection: electionId, refPost: postId } },
    });
    if (!electable) {
      throw new NotFoundError('Posten är inte valbar i detta val');
    }

    await prisma.prismaInterviewPostDuration.upsert({
      where: { refElection_refPost: { refElection: electionId, refPost: postId } },
      create: { refElection: electionId, refPost: postId, minutes },
      update: { minutes },
    });
    return true;
  }

  async getPostDurations(electionId: number, client: Tx = prisma) {
    return client.prismaInterviewPostDuration.findMany({ where: { refElection: electionId } });
  }

  async getDurationConfig(electionId: number, client: Tx = prisma): Promise<DurationConfig> {
    const [settings, durations] = await Promise.all([
      this.getSettings(electionId, client),
      this.getPostDurations(electionId, client),
    ]);
    return {
      defaultDurationMinutes: settings.defaultDurationMinutes,
      maxDurationMinutes: settings.maxDurationMinutes,
      postDurations: new Map(durations.map((d) => [d.refPost, d.minutes])),
    };
  }

  /** Electable posts in the election that require an interview */
  async getInterviewPostIds(electionId: number, client: Tx = prisma): Promise<number[]> {
    const electables = await client.prismaElectable.findMany({
      where: { refElection: electionId, post: { interviewRequired: true } },
      select: { refPost: true },
    });
    return electables.map((e) => e.refPost);
  }

  /** The nominee's accepted nominations for electable interview posts */
  async getAcceptedInterviewPostIds(
    electionId: number,
    username: string,
    client: Tx = prisma,
  ): Promise<number[]> {
    const [nominations, interviewPosts] = await Promise.all([
      client.prismaNomination.findMany({
        where: { refElection: electionId, refUser: username, answer: PrismaNominationAnswer.YES },
        select: { refPost: true },
      }),
      this.getInterviewPostIds(electionId, client),
    ]);
    const interview = new Set(interviewPosts);
    return nominations.map((n) => n.refPost).filter((p) => interview.has(p));
  }

  async getRequiredMinutes(electionId: number, username: string, client: Tx = prisma) {
    const [config, posts] = await Promise.all([
      this.getDurationConfig(electionId, client),
      this.getAcceptedInterviewPostIds(electionId, username, client),
    ]);
    return requiredMinutes(config, posts);
  }

  async isFrozen(electionId: number, now: Date, client: Tx = prisma) {
    return isFrozen(await this.getSettings(electionId, client), now);
  }

  // ---------------------------------------------------------------------------
  // Windows
  // ---------------------------------------------------------------------------

  async getWindows(electionId: number): Promise<PrismaInterviewWindow[]> {
    return prisma.prismaInterviewWindow.findMany({
      where: { refElection: electionId },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
  }

  async getWindow(windowId: number, client: Tx = prisma): Promise<PrismaInterviewWindow> {
    const w = await client.prismaInterviewWindow.findUnique({ where: { id: windowId } });
    if (!w) {
      throw new NotFoundError('Intervjufönstret finns inte');
    }
    return w;
  }

  /** Whether the election has any windows, i.e. whether booking is in use at all */
  async hasWindows(electionId: number) {
    return (await prisma.prismaInterviewWindow.count({ where: { refElection: electionId } })) > 0;
  }

  private validateWindow(w: Required<Pick<WindowInput, 'startsAt' | 'endsAt'>> & WindowInput) {
    if (Number.isNaN(w.startsAt.getTime()) || Number.isNaN(w.endsAt.getTime())) {
      throw new BadRequestError('Ogiltig tid');
    }
    if (w.endsAt <= w.startsAt) {
      throw new BadRequestError('Fönstret måste sluta efter att det börjar');
    }
    if (!w.location?.trim() && !w.videoLink?.trim()) {
      throw new BadRequestError('Ange en plats eller en videolänk');
    }
    if (w.videoLink?.trim() && !/^https?:\/\/[^\s]+$/i.test(w.videoLink.trim())) {
      throw new BadRequestError('Videolänken måste börja med http:// eller https://');
    }
    assertPositiveInt(w.bufferMinutes, 'Buffert', true);
    assertPositiveInt(w.capacity, 'Kapacitet');
    assertPositiveInt(w.stepMinutes, 'Intervall');
  }

  async createWindow(electionId: number, input: WindowInput): Promise<PrismaInterviewWindow> {
    this.validateWindow(input);
    await this.assertElectionExists(electionId);

    return prisma.prismaInterviewWindow.create({
      data: {
        refElection: electionId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location?.trim() || null,
        videoLink: input.videoLink?.trim() || null,
        bufferMinutes: input.bufferMinutes ?? 0,
        capacity: input.capacity ?? 1,
        stepMinutes: input.stepMinutes ?? null,
      },
    });
  }

  /**
   * Updates a window. Existing bookings are never removed; if the location or link
   * changes, the bookings in the window get the new one and their calendar sequence is
   * bumped. Returns those bookings so their nominees can be told.
   */
  async updateWindow(
    windowId: number,
    input: Partial<WindowInput>,
  ): Promise<{ window: PrismaInterviewWindow; relocated: PrismaInterviewBooking[] }> {
    return prisma.$transaction(async (tx) => {
      const current = await this.lockWindow(tx, windowId);
      const merged = {
        startsAt: input.startsAt ?? current.startsAt,
        endsAt: input.endsAt ?? current.endsAt,
        location: input.location !== undefined ? input.location : current.location,
        videoLink: input.videoLink !== undefined ? input.videoLink : current.videoLink,
        bufferMinutes: input.bufferMinutes ?? current.bufferMinutes,
        capacity: input.capacity ?? current.capacity,
        stepMinutes: input.stepMinutes !== undefined ? input.stepMinutes : current.stepMinutes,
      };
      this.validateWindow(merged);

      const window = await tx.prismaInterviewWindow.update({
        where: { id: windowId },
        data: {
          ...merged,
          location: merged.location?.trim() || null,
          videoLink: merged.videoLink?.trim() || null,
        },
      });

      const placeChanged =
        window.location !== current.location || window.videoLink !== current.videoLink;
      if (!placeChanged) {
        return { window, relocated: [] };
      }

      await tx.prismaInterviewBooking.updateMany({
        where: { refWindow: windowId },
        data: {
          location: window.location,
          videoLink: window.videoLink,
          sequence: { increment: 1 },
        },
      });
      await tx.prismaInterviewRequest.updateMany({
        where: { refWindow: windowId, status: PrismaInterviewRequestStatus.PENDING },
        data: { location: window.location, videoLink: window.videoLink },
      });
      const relocated = await tx.prismaInterviewBooking.findMany({
        where: { refWindow: windowId },
      });
      return { window, relocated };
    });
  }

  /** Deletes a window. Its bookings stay, detached from any window */
  async deleteWindow(windowId: number) {
    await this.getWindow(windowId);
    await prisma.prismaInterviewWindow.delete({ where: { id: windowId } });
    return true;
  }

  /** Locks the window row until the transaction ends, serialising bookings in it */
  private async lockWindow(tx: Tx, windowId: number): Promise<PrismaInterviewWindow> {
    const rows = await tx.$queryRaw<{ id: number }[]>`
      SELECT id FROM interview_windows WHERE id = ${windowId} FOR UPDATE`;
    if (rows.length === 0) {
      throw new NotFoundError('Intervjufönstret finns inte');
    }
    return this.getWindow(windowId, tx);
  }

  /** Step for a window: its own, or derived from the election's durations and its buffer */
  async stepFor(window: PrismaInterviewWindow, client: Tx = prisma) {
    if (window.stepMinutes) return window.stepMinutes;
    const [config, posts] = await Promise.all([
      this.getDurationConfig(window.refElection, client),
      this.getInterviewPostIds(window.refElection, client),
    ]);
    return defaultStepMinutes(config, posts, window.bufferMinutes);
  }

  /**
   * Time already taken in a window: its bookings and its pending, unexpired requests.
   * `exceptUser` leaves out that nominee's own booking and request, so rescheduling or
   * accepting a request is not blocked by the nominee's own current time.
   */
  private async takenIn(
    window: PrismaInterviewWindow,
    now: Date,
    client: Tx,
    options: { exceptUser?: string; exceptRequestId?: string } = {},
  ): Promise<Interval[]> {
    const settings = await this.getSettings(window.refElection, client);
    const excludeUser = options.exceptUser ? { refUser: { not: options.exceptUser } } : {};
    const excludeRequest = options.exceptRequestId ? { id: { not: options.exceptRequestId } } : {};
    const [bookings, requests] = await Promise.all([
      client.prismaInterviewBooking.findMany({
        where: { refWindow: window.id, ...excludeUser },
        select: { startsAt: true, endsAt: true },
      }),
      client.prismaInterviewRequest.findMany({
        where: {
          refWindow: window.id,
          status: PrismaInterviewRequestStatus.PENDING,
          startsAt: { gte: addMinutes(now, settings.minNoticeMinutes) },
          ...excludeUser,
          ...excludeRequest,
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);
    return [...bookings, ...requests];
  }

  // ---------------------------------------------------------------------------
  // Nominee side
  // ---------------------------------------------------------------------------

  async getBooking(electionId: number, username: string, client: Tx = prisma) {
    return client.prismaInterviewBooking.findUnique({
      where: { refElection_refUser: { refElection: electionId, refUser: username } },
    });
  }

  async getBookings(electionId: number) {
    return prisma.prismaInterviewBooking.findMany({
      where: { refElection: electionId },
      orderBy: [{ startsAt: 'asc' }, { refUser: 'asc' }],
    });
  }

  /**
   * Start times the nominee could book right now, per window, for `lengthMinutes`
   * (defaults to what they need). Empty when booking is frozen or nothing is needed.
   */
  async getAvailability(
    electionId: number,
    username: string,
    now: Date,
    lengthMinutes?: number,
    client: Tx = prisma,
  ): Promise<WindowAvailability[]> {
    const settings = await this.getSettings(electionId, client);
    if (isFrozen(settings, now)) return [];

    const length = lengthMinutes ?? (await this.getRequiredMinutes(electionId, username, client));
    if (length <= 0) return [];

    const notBefore = addMinutes(now, settings.minNoticeMinutes);
    const windows = await client.prismaInterviewWindow.findMany({
      where: { refElection: electionId, endsAt: { gt: notBefore } },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });

    const result: WindowAvailability[] = [];
    for (const window of windows) {
      const [step, taken] = await Promise.all([
        this.stepFor(window, client),
        this.takenIn(window, now, client, { exceptUser: username }),
      ]);
      const starts = availableStarts(window, step, length, taken, { notBefore });
      if (starts.length) result.push({ window, starts });
    }
    return result;
  }

  /**
   * Books, or reschedules to, `startsAt` in a window. The window row is locked while the
   * fit is checked and the booking written, so two nominees can never both get the last
   * spot. Returns the new booking and the one it replaced, if any.
   */
  async book(
    electionId: number,
    username: string,
    windowId: number,
    startsAt: Date,
    now: Date,
    client?: Tx,
    /**
     * Recreate a booking removed earlier in the same transaction under its old id and
     * next sequence, so calendars update the existing event instead of adding one
     */
    replaces?: Pick<PrismaInterviewBooking, 'id' | 'sequence'>,
  ): Promise<{ booking: PrismaInterviewBooking; previous: PrismaInterviewBooking | null }> {
    const run = async (tx: Tx) => {
      const window = await this.lockWindow(tx, windowId);
      if (window.refElection !== electionId) {
        throw new BadRequestError('Intervjufönstret hör inte till detta val');
      }

      const settings = await this.getSettings(electionId, tx);
      if (isFrozen(settings, now)) {
        throw new ForbiddenError('Bokningen är stängd. Kontakta valberedningen.');
      }

      const length = await this.getRequiredMinutes(electionId, username, tx);
      if (length <= 0) {
        throw new BadRequestError('Du har inga accepterade nomineringar som kräver intervju');
      }

      const [step, taken] = await Promise.all([
        this.stepFor(window, tx),
        this.takenIn(window, now, tx, { exceptUser: username }),
      ]);
      const fit = checkFit(window, step, startsAt, length, taken, {
        notBefore: addMinutes(now, settings.minNoticeMinutes),
      });
      if (!fit.ok) {
        throw new BadRequestError(fitMessage(fit));
      }

      const previous = await this.getBooking(electionId, username, tx);
      const data = {
        refWindow: window.id,
        startsAt,
        endsAt: addMinutes(startsAt, length),
        location: window.location,
        videoLink: window.videoLink,
        needsAdminAttention: false,
      };
      const booking = previous
        ? await tx.prismaInterviewBooking.update({
            where: { id: previous.id },
            data: { ...data, sequence: { increment: 1 } },
          })
        : await tx.prismaInterviewBooking.create({
            data: {
              ...data,
              refElection: electionId,
              refUser: username,
              ...(replaces ? { id: replaces.id, sequence: replaces.sequence + 1 } : {}),
            },
          });

      // A booking the nominee made themselves replaces any pending request
      await tx.prismaInterviewRequest.updateMany({
        where: {
          refElection: electionId,
          refUser: username,
          status: PrismaInterviewRequestStatus.PENDING,
        },
        data: { status: PrismaInterviewRequestStatus.WITHDRAWN, resolvedAt: now },
      });

      return { booking, previous };
    };

    return client ? run(client) : prisma.$transaction(run);
  }

  /** Nominee cancels their own booking, allowed until the freeze */
  async cancelOwnBooking(electionId: number, username: string, now: Date) {
    return prisma.$transaction(async (tx) => {
      if (await this.isFrozen(electionId, now, tx)) {
        throw new ForbiddenError('Avbokning är stängd. Kontakta valberedningen.');
      }
      const booking = await this.getBooking(electionId, username, tx);
      if (!booking) {
        throw new NotFoundError('Du har ingen bokad intervju');
      }
      await tx.prismaInterviewBooking.delete({ where: { id: booking.id } });
      return booking;
    });
  }

  /** Records that nothing fit the nominee, for the committee's daily summary */
  async recordNoSlot(electionId: number, username: string, minutes: number) {
    await prisma.prismaInterviewNoSlotEvent.create({
      data: { refElection: electionId, refUser: username, requiredMinutes: minutes },
    });
  }

  // ---------------------------------------------------------------------------
  // Nomination changes
  // ---------------------------------------------------------------------------

  /**
   * Works out what changing the nominee's answer for one post would do to their booking,
   * without changing anything.
   */
  async previewNominationChange(
    electionId: number,
    username: string,
    postId: number,
    answer: PrismaNominationAnswer,
    now: Date,
    client: Tx = prisma,
  ): Promise<NominationOutcome> {
    const [config, before, interviewPosts, booking, settings, pending] = await Promise.all([
      this.getDurationConfig(electionId, client),
      this.getAcceptedInterviewPostIds(electionId, username, client),
      this.getInterviewPostIds(electionId, client),
      this.getBooking(electionId, username, client),
      this.getSettings(electionId, client),
      this.getPendingRequest(electionId, username, now, client),
    ]);

    let after = before.filter((p) => p !== postId);
    if (answer === PrismaNominationAnswer.YES && interviewPosts.includes(postId)) {
      after = [...after, postId];
    }

    const requiredAfter = requiredMinutes(config, after);
    const effect = bookingEffect({
      booking,
      frozen: isFrozen(settings, now),
      config,
      before,
      after,
    });

    const requestLength = pending ? minutesBetween(pending.startsAt, pending.endsAt) : null;
    return {
      effect,
      requiredMinutesBefore: requiredMinutes(config, before),
      requiredMinutesAfter: requiredAfter,
      booking,
      withdrawnRequest: pending && requestLength !== requiredAfter ? pending : null,
    };
  }

  /**
   * Applies the effect of a nomination change to the booking, inside the transaction
   * that changes the nomination. Must be called before the nomination row is updated.
   */
  async applyNominationChange(
    tx: Tx,
    electionId: number,
    username: string,
    postId: number,
    answer: PrismaNominationAnswer,
    now: Date,
  ): Promise<NominationOutcome> {
    const outcome = await this.previewNominationChange(
      electionId,
      username,
      postId,
      answer,
      now,
      tx,
    );
    const { effect, booking, withdrawnRequest } = outcome;

    if (booking) {
      switch (effect) {
        case 'UNBOOKED':
        case 'FREED':
          await tx.prismaInterviewBooking.delete({ where: { id: booking.id } });
          break;
        case 'KEPT_POST_ADDED':
        case 'KEPT_POST_REMOVED':
          // The covered posts changed, so the calendar invite is updated
          outcome.booking = await tx.prismaInterviewBooking.update({
            where: { id: booking.id },
            data: { sequence: { increment: 1 } },
          });
          break;
        case 'FLAGGED':
          outcome.booking = await tx.prismaInterviewBooking.update({
            where: { id: booking.id },
            data: { needsAdminAttention: true },
          });
          break;
        case 'NONE':
        default:
          break;
      }
    }

    if (withdrawnRequest) {
      await tx.prismaInterviewRequest.update({
        where: { id: withdrawnRequest.id },
        data: { status: PrismaInterviewRequestStatus.WITHDRAWN, resolvedAt: now },
      });
    }

    return outcome;
  }

  // ---------------------------------------------------------------------------
  // Admin requests
  // ---------------------------------------------------------------------------

  /** The nominee's pending request that has not yet expired */
  async getPendingRequest(electionId: number, username: string, now: Date, client: Tx = prisma) {
    const settings = await this.getSettings(electionId, client);
    return client.prismaInterviewRequest.findFirst({
      where: {
        refElection: electionId,
        refUser: username,
        status: PrismaInterviewRequestStatus.PENDING,
        startsAt: { gte: addMinutes(now, settings.minNoticeMinutes) },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests(electionId: number, now: Date) {
    const settings = await this.getSettings(electionId);
    return prisma.prismaInterviewRequest.findMany({
      where: {
        refElection: electionId,
        status: PrismaInterviewRequestStatus.PENDING,
        startsAt: { gte: addMinutes(now, settings.minNoticeMinutes) },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  /**
   * Admin proposes a time for a nominee. The time is reserved while pending. Any earlier
   * pending request for the nominee is withdrawn. Works before and after the freeze.
   */
  async createRequest(
    creator: string,
    electionId: number,
    username: string,
    windowId: number,
    startsAt: Date,
    now: Date,
  ): Promise<{ request: PrismaInterviewRequest; replaced: PrismaInterviewRequest | null }> {
    return prisma.$transaction(async (tx) => {
      const window = await this.lockWindow(tx, windowId);
      if (window.refElection !== electionId) {
        throw new BadRequestError('Intervjufönstret hör inte till detta val');
      }

      const length = await this.getRequiredMinutes(electionId, username, tx);
      if (length <= 0) {
        throw new BadRequestError('Nominerade har inga accepterade poster som kräver intervju');
      }

      const settings = await this.getSettings(electionId, tx);
      const taken = await this.takenIn(window, now, tx, { exceptUser: username });
      const fit = checkFit(window, 1, startsAt, length, taken, {
        requireGrid: false,
        notBefore: addMinutes(now, settings.minNoticeMinutes),
      });
      if (!fit.ok) {
        throw new BadRequestError(fitMessage(fit));
      }

      const replaced = await this.getPendingRequest(electionId, username, now, tx);
      await tx.prismaInterviewRequest.updateMany({
        where: {
          refElection: electionId,
          refUser: username,
          status: PrismaInterviewRequestStatus.PENDING,
        },
        data: { status: PrismaInterviewRequestStatus.WITHDRAWN, resolvedAt: now },
      });

      const request = await tx.prismaInterviewRequest.create({
        data: {
          refElection: electionId,
          refUser: username,
          refCreator: creator,
          refWindow: window.id,
          startsAt,
          endsAt: addMinutes(startsAt, length),
          location: window.location,
          videoLink: window.videoLink,
        },
      });
      return { request, replaced };
    });
  }

  async getRequest(requestId: string, client: Tx = prisma) {
    const r = await client.prismaInterviewRequest.findUnique({ where: { id: requestId } });
    if (!r) {
      throw new NotFoundError('Förfrågan finns inte');
    }
    return r;
  }

  /**
   * Nominee accepts or declines an admin request. Accepting replaces their booking.
   * The request must still be pending, unexpired and match the length they need.
   */
  async respondToRequest(
    username: string,
    requestId: string,
    accept: boolean,
    now: Date,
  ): Promise<{
    request: PrismaInterviewRequest;
    booking: PrismaInterviewBooking | null;
    previous: PrismaInterviewBooking | null;
  }> {
    return prisma.$transaction(async (tx) => {
      const request = await this.getRequest(requestId, tx);
      if (request.refUser !== username) {
        throw new NotFoundError('Förfrågan finns inte');
      }
      if (request.status !== PrismaInterviewRequestStatus.PENDING) {
        throw new BadRequestError('Förfrågan är inte längre aktiv');
      }

      const settings = await this.getSettings(request.refElection, tx);
      if (request.startsAt < addMinutes(now, settings.minNoticeMinutes)) {
        throw new BadRequestError('Förfrågan har gått ut');
      }

      if (!accept) {
        const declined = await tx.prismaInterviewRequest.update({
          where: { id: request.id },
          data: { status: PrismaInterviewRequestStatus.DECLINED, resolvedAt: now },
        });
        return { request: declined, booking: null, previous: null };
      }

      if (!request.refWindow) {
        throw new BadRequestError('Intervjufönstret för förfrågan finns inte längre');
      }
      const window = await this.lockWindow(tx, request.refWindow);

      const length = await this.getRequiredMinutes(request.refElection, username, tx);
      if (length !== minutesBetween(request.startsAt, request.endsAt)) {
        throw new BadRequestError('Förfrågan stämmer inte längre med dina nomineringar');
      }

      const taken = await this.takenIn(window, now, tx, {
        exceptUser: username,
        exceptRequestId: request.id,
      });
      const fit = checkFit(window, 1, request.startsAt, length, taken, { requireGrid: false });
      if (!fit.ok) {
        // Should not happen since the request reserved its time; kept as a safety net
        logger.error(`Accepted request ${request.id} no longer fits: ${JSON.stringify(fit)}`);
        throw new BadRequestError(fitMessage(fit));
      }

      const previous = await this.getBooking(request.refElection, username, tx);
      const data = {
        refWindow: window.id,
        startsAt: request.startsAt,
        endsAt: request.endsAt,
        location: request.location,
        videoLink: request.videoLink,
        needsAdminAttention: false,
      };
      const booking = previous
        ? await tx.prismaInterviewBooking.update({
            where: { id: previous.id },
            data: { ...data, sequence: { increment: 1 } },
          })
        : await tx.prismaInterviewBooking.create({
            data: { ...data, refElection: request.refElection, refUser: username },
          });

      const accepted = await tx.prismaInterviewRequest.update({
        where: { id: request.id },
        data: { status: PrismaInterviewRequestStatus.ACCEPTED, resolvedAt: now },
      });
      return { request: accepted, booking, previous };
    });
  }

  async withdrawRequest(requestId: string, now: Date) {
    const request = await this.getRequest(requestId);
    if (request.status !== PrismaInterviewRequestStatus.PENDING) {
      throw new BadRequestError('Förfrågan är inte längre aktiv');
    }
    return prisma.prismaInterviewRequest.update({
      where: { id: requestId },
      data: { status: PrismaInterviewRequestStatus.WITHDRAWN, resolvedAt: now },
    });
  }

  /** Admin cancels a booking, at any time and without the nominee's approval */
  async adminCancelBooking(bookingId: string) {
    const booking = await prisma.prismaInterviewBooking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundError('Bokningen finns inte');
    }
    await prisma.prismaInterviewBooking.delete({ where: { id: bookingId } });
    return booking;
  }

  // ---------------------------------------------------------------------------
  // Admin overview
  // ---------------------------------------------------------------------------

  /** Nominees with accepted interview posts and their required length */
  async getInterviewNominees(electionId: number, client: Tx = prisma) {
    const [config, interviewPosts] = await Promise.all([
      this.getDurationConfig(electionId, client),
      this.getInterviewPostIds(electionId, client),
    ]);
    const nominations = await client.prismaNomination.findMany({
      where: {
        refElection: electionId,
        answer: PrismaNominationAnswer.YES,
        refPost: { in: interviewPosts },
      },
      select: { refUser: true, refPost: true },
    });

    const byUser = new Map<string, number[]>();
    for (const n of nominations) {
      byUser.set(n.refUser, [...(byUser.get(n.refUser) ?? []), n.refPost]);
    }
    return [...byUser.entries()]
      .map(([username, posts]) => ({ username, requiredMinutes: requiredMinutes(config, posts) }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  /** Nominees who need an interview and have no booking */
  async getUnbookedNominees(electionId: number) {
    const [nominees, bookings] = await Promise.all([
      this.getInterviewNominees(electionId),
      this.getBookings(electionId),
    ]);
    const booked = new Set(bookings.map((b) => b.refUser));
    return nominees.filter((n) => !booked.has(n.username));
  }

  async getMissingView(electionId: number, now: Date): Promise<MissingView> {
    const [nominees, bookings, windows] = await Promise.all([
      this.getInterviewNominees(electionId),
      this.getBookings(electionId),
      prisma.prismaInterviewWindow.findMany({ where: { refElection: electionId } }),
    ]);

    const required = new Map(nominees.map((n) => [n.username, n.requiredMinutes]));
    const booked = new Set(bookings.map((b) => b.refUser));
    const unbooked = nominees.filter((n) => !booked.has(n.username));
    const windowsById = new Map(windows.map((w) => [w.id, w]));

    const outsideWindow: PrismaInterviewBooking[] = [];
    const overCapacity: PrismaInterviewBooking[] = [];
    for (const b of bookings) {
      const w = b.refWindow ? windowsById.get(b.refWindow) : undefined;
      if (!w || b.startsAt < w.startsAt || b.endsAt > w.endsAt) {
        outsideWindow.push(b);
        continue;
      }
      const others = bookings
        .filter((o) => o.id !== b.id && o.refWindow === w.id)
        .map((o) => ({ startsAt: o.startsAt, endsAt: addMinutes(o.endsAt, w.bufferMinutes) }));
      const self = { startsAt: b.startsAt, endsAt: addMinutes(b.endsAt, w.bufferMinutes) };
      if (maxConcurrent(self, others) + 1 > w.capacity) {
        overCapacity.push(b);
      }
    }

    // Free time only counts in the future, after the minimum notice
    const settings = await this.getSettings(electionId);
    const notBefore = addMinutes(now, settings.minNoticeMinutes);
    let minutesAvailable = 0;
    for (const w of windows) {
      if (w.endsAt <= notBefore) continue;
      const clipped = { ...w, startsAt: w.startsAt < notBefore ? notBefore : w.startsAt };
      const taken = await this.takenIn(w, now, prisma);
      minutesAvailable += freeMinutes(clipped, taken);
    }

    return {
      unbooked,
      minutesNeeded: unbooked.reduce((acc, n) => acc + n.requiredMinutes, 0),
      minutesAvailable,
      tooShort: bookings
        .map((booking) => ({ booking, requiredMinutes: required.get(booking.refUser) ?? 0 }))
        .filter((x) => minutesBetween(x.booking.startsAt, x.booking.endsAt) < x.requiredMinutes),
      outsideWindow,
      overCapacity,
      needsAttention: bookings.filter((b) => b.needsAdminAttention),
    };
  }

  // ---------------------------------------------------------------------------
  // Daily summary
  // ---------------------------------------------------------------------------

  /**
   * Claims the daily summary for an election: returns the "no slot" events since the last
   * summary and marks the summary as sent at `summaryTime`, atomically. A second caller for
   * the same `summaryTime` (another instance, a restart) gets null.
   */
  async claimDailySummary(electionId: number, summaryTime: Date) {
    return prisma.$transaction(async (tx) => {
      await tx.prismaInterviewSettings.upsert({
        where: { refElection: electionId },
        create: { refElection: electionId },
        update: {},
      });
      const rows = await tx.$queryRaw<{ last: Date | null }[]>`
        SELECT last_summary_sent_at AS last FROM interview_settings
        WHERE ref_election = ${electionId} FOR UPDATE`;
      const last = rows[0]?.last ?? null;
      if (last && last >= summaryTime) return null;

      const events = await tx.prismaInterviewNoSlotEvent.findMany({
        where: {
          refElection: electionId,
          createdAt: { lte: summaryTime, ...(last ? { gt: last } : {}) },
        },
        orderBy: { createdAt: 'asc' },
      });
      await tx.prismaInterviewSettings.update({
        where: { refElection: electionId },
        data: { lastSummarySentAt: summaryTime },
      });
      return { events, settings: await this.getSettings(electionId, tx) };
    });
  }

  /** Elections with "no slot" events after their last summary */
  async getElectionsWithPendingSummary(summaryTime: Date): Promise<number[]> {
    const events = await prisma.prismaInterviewNoSlotEvent.findMany({
      where: { createdAt: { lte: summaryTime } },
      select: { refElection: true, createdAt: true },
      distinct: ['refElection'],
      orderBy: { createdAt: 'desc' },
    });
    return events.map((e) => e.refElection);
  }

  private async assertElectionExists(electionId: number) {
    const e = await prisma.prismaElection.findUnique({ where: { id: electionId } });
    if (!e) {
      throw new NotFoundError('Valet finns inte');
    }
  }
}
