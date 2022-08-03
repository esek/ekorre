import { reduce } from '@/reducers';
import { hasAccess } from '@/util';
import { GetMeetingsOptions, MeetingAPI } from '@api/meeting';
import { Feature, Resolvers } from '@generated/graphql';
import { meetingReduce } from '@reducer/meeting';

const api = new MeetingAPI();

// TODO: Säkra upp, typ kräv inlogg för queries och
// admin för mutations

const meetingResolver: Resolvers = {
  Meeting: {
    // För dessa löser Files-resolvern att omvandla FileResponse -> File
    summons: async ({ summons }, _, ctx) => {
      if (summons?.id != null) {
        return ctx.fileDataLoader.load(summons.id);
      }
      return null;
    },
    documents: async ({ documents }, _, ctx) => {
      if (documents?.id != null) {
        return ctx.fileDataLoader.load(documents.id);
      }
      return null;
    },
    lateDocuments: async ({ lateDocuments }, _, ctx) => {
      if (lateDocuments?.id != null) {
        return ctx.fileDataLoader.load(lateDocuments.id);
      }
      return null;
    },
    protocol: async ({ protocol }, _, ctx) => {
      if (protocol?.id != null) {
        return ctx.fileDataLoader.load(protocol.id);
      }
      return null;
    },
    appendix: async ({ appendix }, _, ctx) => {
      if (appendix?.id != null) {
        return ctx.fileDataLoader.load(appendix.id);
      }
      return null;
    },
  },
  Query: {
    meeting: async (_, { id }) => {
      // Meetings _should_ be visible to the public
      const m = await api.getSingleMeeting(id);
      return reduce(m, meetingReduce);
    },
    meetings: async (_, { number, year, type }) => {
      // Meetings _should_ be visible to the public
      const m = await api.getMultipleMeetings(number, year, type);
      return reduce(m, meetingReduce);
    },
    latestBoardMeetings: async (_, { limit }) => {
      // Meetings _should_ be visible to the public
      const m = await api.getLatestBoardMeetings(limit ?? undefined);
      return reduce(m, meetingReduce);
    },
  },
  Mutation: {
    addMeeting: async (_, { type, number, year }, ctx) => {
      await hasAccess(ctx, Feature.MeetingsAdmin);
      const meeting = await api.createMeeting(type, number ?? undefined, year ?? undefined);

      return reduce(meeting, meetingReduce);
    },
    removeMeeting: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.MeetingsAdmin);
      return api.removeMeeting(id);
    },
    addFileToMeeting: async (_, { meetingId, fileId, fileType }, ctx) => {
      await hasAccess(ctx, Feature.MeetingsAdmin);
      return api.addFileToMeeting(meetingId, fileId, fileType);
    },
    removeFileFromMeeting: async (_, { meetingId, fileType }, ctx) => {
      await hasAccess(ctx, Feature.MeetingsAdmin);
      return api.removeFileFromMeeting(meetingId, fileType);
    },
  },
};

export default meetingResolver;
