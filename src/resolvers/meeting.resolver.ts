import { MeetingAPI } from '../api/meeting.api';
import { BadRequestError } from '../errors/RequestErrors';
import type { Resolvers } from '../graphql.generated';
import { StrictObject } from '../models/base';
import { reduce } from '../reducers';
import { meetingReduce } from '../reducers/meeting.reducer';

const api = new MeetingAPI();

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
  },
  Query: {
    meeting: async (_, { id }) => {
      const m = await api.getSingleMeeting(id);
      return reduce(m, meetingReduce);
    },
    meetings: async (_, params) => {
      const safeParams: StrictObject = params;
      Object.keys(safeParams).forEach(p => p ?? undefined);
      const m = await api.getMultipleMeetings(safeParams);
      return reduce(m, meetingReduce);
    },
    latestBoardMeetings: async (_, { limit }) => {
      if (limit == null) {
        throw new BadRequestError('limit måste vara en int');
      }
      const m = await api.getLatestBoardMeetings(limit);
      return reduce(m, meetingReduce);
    },
  },
  Mutation: {
    addMeeting: async (_, { type, number, year }) => {
      return api.createMeeting(type, number ?? undefined, year ?? undefined);
    },
    addFileToMeeting: async (_, { meetingId, fileId, fileType }) => {
      return api.addFileToMeeting(meetingId, fileId, fileType);
    },
    removeFileFromMeeting: async (_, { meetingId, fileType }) => {
      return api.removeFileFromMeeting(meetingId, fileType);
    },
  },
};

export default meetingResolver;