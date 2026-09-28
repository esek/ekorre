import { useDataLoader } from '@/dataloaders';
import { NotFoundError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { hasAccess, hasAuthenticated } from '@/util';
import { ElectionAPI } from '@api/election';
import { InterviewAPI } from '@api/interview';
import { PostAPI } from '@api/post';
import { UserAPI } from '@api/user';
import {
  Feature,
  InterviewBookingEffect,
  InterviewRequestStatus,
  Resolvers,
} from '@generated/graphql';
import { PrismaInterviewBooking, PrismaNominationAnswer } from '@prisma/client';
import {
  MailPerson,
  sendBookingMail,
  sendBookingRemovedMail,
  sendCommitteeMail,
  sendRequestMail,
  sendRequestWithdrawnMail,
  sendSlotsUpdatedMail,
} from '@service/interview-mail';
import { isFrozen } from '@service/interview-rules';

const api = new InterviewAPI();
const electionApi = new ElectionAPI();
const userApi = new UserAPI();
const postApi = new PostAPI();
const logger = Logger.getLogger('InterviewResolver');

export const person = async (username: string): Promise<MailPerson> => {
  const u = await userApi.getSingleUser(username);
  return { username: u.username, firstName: u.firstName, lastName: u.lastName, email: u.email };
};

export const interviewPostnames = async (electionId: number, username: string) => {
  const ids = await api.getAcceptedInterviewPostIds(electionId, username);
  if (!ids.length) return [];
  const posts = await postApi.getMultiplePosts(ids);
  return posts.map((p) => p.postname).sort((a, b) => a.localeCompare(b, 'sv'));
};

export const organizerEmail = async (electionId: number) =>
  (await api.getSettings(electionId)).notifyEmails[0];

/** The open election containing the logged in user's nomination for a post */
const openElectionForNomination = async (username: string, postId: number) => {
  const open = await electionApi.getOpenElections();
  for (const e of open) {
    const n = await electionApi.getAllNominationsForUser(e.id, username);
    if (n.some((x) => x.refPost === postId)) return e.id;
  }
  throw new NotFoundError('Kunde inte hitta nomineringen!');
};

/** Mails the nominee and committee about what a nomination answer did to the booking */
export const notifyNominationOutcome = async (
  electionId: number,
  username: string,
  outcome: Awaited<ReturnType<InterviewAPI['applyNominationChange']>>,
  rebooked: PrismaInterviewBooking | null,
) => {
  const { effect, booking, withdrawnRequest } = outcome;
  if (effect === 'NONE' && !withdrawnRequest) return;

  try {
    const [nominee, postnames, settings] = await Promise.all([
      person(username),
      interviewPostnames(electionId, username),
      api.getSettings(electionId),
    ]);
    const organizer = settings.notifyEmails[0];
    const name = `${nominee.firstName} ${nominee.lastName} (${username})`;

    if (booking) {
      switch (effect) {
        case 'UNBOOKED':
          if (rebooked) {
            await sendBookingMail(
              'RESCHEDULED',
              electionId,
              nominee,
              rebooked,
              postnames,
              organizer,
            );
          } else {
            await sendBookingRemovedMail('UNBOOKED', electionId, nominee, booking, organizer);
          }
          break;
        case 'FREED':
          await sendBookingRemovedMail('FREED', electionId, nominee, booking, organizer);
          break;
        case 'KEPT_POST_ADDED':
          await sendBookingMail('POSTS_ADDED', electionId, nominee, booking, postnames, organizer);
          break;
        case 'KEPT_POST_REMOVED':
          await sendBookingMail(
            'POSTS_REMOVED',
            electionId,
            nominee,
            booking,
            postnames,
            organizer,
          );
          break;
        case 'SHORTENED':
          await sendBookingMail('SHORTENED', electionId, nominee, booking, postnames, organizer);
          break;
        case 'FLAGGED':
          await sendCommitteeMail(
            settings.notifyEmails,
            'Nomineringar ändrade efter stängning',
            'En bokad nominerad har ändrat sina nomineringar',
            [
              `${name} har ändrat sina nomineringar efter att bokningen stängts.`,
              `Bokningen är kvar och behöver ses över. Poster nu: ${
                postnames.join(', ') || 'inga'
              }.`,
            ],
            electionId,
          );
          break;
        default:
          break;
      }
    }

    if (withdrawnRequest) {
      await sendRequestWithdrawnMail(electionId, nominee, withdrawnRequest, true);
      await sendCommitteeMail(
        settings.notifyEmails,
        'Förslag på intervjutid återkallat',
        'Ett förslag på intervjutid har återkallats',
        [
          `${name} har ändrat sina nomineringar så att intervjun behöver en annan längd.`,
          'Ert förslag på tid har därför dragits tillbaka. Föreslå en ny tid om det behövs.',
        ],
        electionId,
      );
    }
  } catch (err) {
    logger.error(`Could not send mail after nomination change for ${username}`);
    logger.error(err);
  }
};

const interviewResolver: Resolvers = {
  Query: {
    myInterview: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const now = new Date();
      const [enabled, requiredMinutes, booking, pendingRequest, settings] = await Promise.all([
        api.hasWindows(electionId),
        api.getRequiredMinutes(electionId, username),
        api.getBooking(electionId, username),
        api.getPendingRequest(electionId, username, now),
        api.getSettings(electionId),
      ]);
      return {
        enabled,
        requiredMinutes,
        booking,
        pendingRequest,
        frozen: isFrozen(settings, now),
        freezeAt: settings.freezeAt,
        availability: enabled ? await api.getAvailability(electionId, username, now) : [],
      };
    },
    nominationResponsePreview: async (_, { postId, accepts }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const now = new Date();
      const electionId = await openElectionForNomination(username, postId);
      const preview = await api.previewNominationChange(
        electionId,
        username,
        postId,
        accepts as PrismaNominationAnswer,
        now,
      );
      return {
        effect: preview.effect as InterviewBookingEffect,
        requiredMinutesBefore: preview.requiredMinutesBefore,
        requiredMinutesAfter: preview.requiredMinutesAfter,
        booking: preview.booking,
        requestWithdrawn: preview.withdrawnRequest !== null,
        availability:
          preview.effect === 'UNBOOKED'
            ? await api.getAvailability(electionId, username, now, preview.requiredMinutesAfter)
            : [],
      };
    },
    interviewSettings: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.getSettings(electionId);
    },
    interviewWindows: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.getWindows(electionId);
    },
    interviewBookings: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.getBookings(electionId);
    },
    interviewRequests: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.getPendingRequests(electionId, new Date());
    },
    interviewMissing: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const view = await api.getMissingView(electionId, new Date());
      return view;
    },
    interviewAvailabilityFor: async (_, { electionId, username }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.getAvailability(electionId, username, new Date());
    },
  },
  Mutation: {
    bookInterview: async (_, { electionId, windowId, startsAt }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const { booking, previous } = await api.book(
        electionId,
        username,
        windowId,
        startsAt,
        new Date(),
      );
      const [nominee, postnames, organizer] = await Promise.all([
        person(username),
        interviewPostnames(electionId, username),
        organizerEmail(electionId),
      ]);
      await sendBookingMail(
        previous ? 'RESCHEDULED' : 'BOOKED',
        electionId,
        nominee,
        booking,
        postnames,
        organizer,
      );
      return booking;
    },
    cancelMyInterview: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const booking = await api.cancelOwnBooking(electionId, username, new Date());
      await sendBookingRemovedMail(
        'CANCELLED_BY_NOMINEE',
        electionId,
        await person(username),
        booking,
        await organizerEmail(electionId),
      );
      return true;
    },
    reportNoInterviewSlot: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const now = new Date();
      const [required, booking, frozen, availability] = await Promise.all([
        api.getRequiredMinutes(electionId, username),
        api.getBooking(electionId, username),
        api.isFrozen(electionId, now),
        api.getAvailability(electionId, username, now),
      ]);
      // Only record it when it is true, so the summary cannot be spammed
      if (required <= 0 || booking || frozen || availability.length > 0) {
        return false;
      }
      await api.recordNoSlot(electionId, username, required);
      return true;
    },
    respondToInterviewRequest: async (_, { requestId, accept }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();
      const { request, booking } = await api.respondToRequest(
        username,
        requestId,
        accept,
        new Date(),
      );
      if (booking) {
        const [nominee, postnames, organizer] = await Promise.all([
          person(username),
          interviewPostnames(request.refElection, username),
          organizerEmail(request.refElection),
        ]);
        await sendBookingMail(
          'REQUEST_ACCEPTED',
          request.refElection,
          nominee,
          booking,
          postnames,
          organizer,
        );
      }
      return true;
    },

    updateInterviewSettings: async (_, { electionId, input }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { clearFreezeAt, freezeAt, ...rest } = input;
      const cleaned = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== null && v !== undefined),
      );
      return api.updateSettings(electionId, {
        ...cleaned,
        ...(clearFreezeAt ? { freezeAt: null } : freezeAt ? { freezeAt } : {}),
      });
    },
    setInterviewPostDuration: async (_, { electionId, postId, minutes }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.setPostDuration(electionId, postId, minutes ?? null);
    },
    createInterviewWindow: async (_, { electionId, input }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.createWindow(electionId, {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location,
        videoLink: input.videoLink,
        bufferMinutes: input.bufferMinutes ?? undefined,
        capacity: input.capacity ?? undefined,
        stepMinutes: input.stepMinutes,
      });
    },
    updateInterviewWindow: async (_, { windowId, input }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { window, relocated } = await api.updateWindow(windowId, {
        startsAt: input.startsAt ?? undefined,
        endsAt: input.endsAt ?? undefined,
        location: input.location,
        videoLink: input.videoLink,
        bufferMinutes: input.bufferMinutes ?? undefined,
        capacity: input.capacity ?? undefined,
        stepMinutes: input.clearStepMinutes ? null : input.stepMinutes ?? undefined,
      });
      const organizer = await organizerEmail(window.refElection);
      for (const booking of relocated) {
        const [nominee, postnames] = await Promise.all([
          person(booking.refUser),
          interviewPostnames(window.refElection, booking.refUser),
        ]);
        await sendBookingMail(
          'RELOCATED',
          window.refElection,
          nominee,
          booking,
          postnames,
          organizer,
        );
      }
      return window;
    },
    deleteInterviewWindow: async (_, { windowId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.deleteWindow(windowId);
    },
    requestInterview: async (_, { electionId, username, windowId, startsAt }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { request } = await api.createRequest(
        ctx.getUsername(),
        electionId,
        username,
        windowId,
        startsAt,
        new Date(),
      );
      await sendRequestMail(
        electionId,
        await person(username),
        request,
        await interviewPostnames(electionId, username),
      );
      return request;
    },
    withdrawInterviewRequest: async (_, { requestId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const request = await api.withdrawRequest(requestId, new Date());
      await sendRequestWithdrawnMail(
        request.refElection,
        await person(request.refUser),
        request,
        false,
      );
      return true;
    },
    cancelInterviewBooking: async (_, { bookingId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const booking = await api.adminCancelBooking(bookingId);
      await sendBookingRemovedMail(
        'CANCELLED_BY_ADMIN',
        booking.refElection,
        await person(booking.refUser),
        booking,
        await organizerEmail(booking.refElection),
      );
      return true;
    },
    notifyUnbookedNominees: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      if (await api.isFrozen(electionId, new Date())) return 0;
      const unbooked = await api.getUnbookedNominees(electionId);
      let sent = 0;
      for (const { username } of unbooked) {
        if (await sendSlotsUpdatedMail(electionId, await person(username))) sent += 1;
      }
      return sent;
    },
  },

  InterviewSettings: {
    electionId: (model) => model.refElection,
    isFrozen: (model) => isFrozen(model, new Date()),
    postDurations: (model) => api.getPostDurations(model.refElection),
  },
  InterviewPostDuration: {
    post: useDataLoader((model, ctx) => ({ dataLoader: ctx.postDataLoader, key: model.refPost })),
  },
  InterviewWindow: {
    effectiveStepMinutes: (model) => api.stepFor(model),
  },
  InterviewBooking: {
    user: useDataLoader((model, ctx) => ({ dataLoader: ctx.userDataLoader, key: model.refUser })),
    posts: async (model, _, ctx) => {
      const ids = await api.getAcceptedInterviewPostIds(model.refElection, model.refUser);
      return Promise.all(ids.map((id) => ctx.postDataLoader.load(id)));
    },
    windowId: (model) => model.refWindow,
    requiredMinutes: (model) => api.getRequiredMinutes(model.refElection, model.refUser),
  },
  InterviewRequest: {
    user: useDataLoader((model, ctx) => ({ dataLoader: ctx.userDataLoader, key: model.refUser })),
    status: (model) => model.status as InterviewRequestStatus,
  },
  InterviewNominee: {
    user: useDataLoader((model, ctx) => ({ dataLoader: ctx.userDataLoader, key: model.username })),
  },
};

export default interviewResolver;
