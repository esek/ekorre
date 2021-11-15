import { MeetingAPI } from '../api/meeting.api';
import type { Resolvers } from '../graphql.generated';
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
    }
  },
  Mutation: {

  },
};

export default meetingResolver;