import { MeetingAPI } from '../api/meeting.api';
import type { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { meetingReduce } from '../reducers/meeting.reducer';

const api = new MeetingAPI();

const meetingResolver: Resolvers = {
  Meeting: {
    summons: async ({ summons }, _, ctx) => {
      if (summons?.id != null) {
        const f = await ctx.fileDataLoader.load(summons.id);
        // If username is null here, something is reeaally fucky
        f.createdBy = await ctx.userDataLoader.load(f.createdBy?.username ?? '');
        return f;
      }
      return null;
    },
    documents: async ({ documents }, _, ctx) => {
      if (documents?.id != null) {
        const f = await ctx.fileDataLoader.load(documents.id);
        // If username is null here, something is reeaally fucky
        f.createdBy = await ctx.userDataLoader.load(f.createdBy?.username ?? '');
        return f;
      }
      return null;
    },
    lateDocuments: async ({ lateDocuments }, _, ctx) => {
      if (lateDocuments?.id != null) {
        const f = await ctx.fileDataLoader.load(lateDocuments.id);
        // If username is null here, something is reeaally fucky
        f.createdBy = await ctx.userDataLoader.load(f.createdBy?.username ?? '');
        return f;
      }
      return null;
    },
    protocol: async ({ protocol }, _, ctx) => {
      if (protocol?.id != null) {
        const f = await ctx.fileDataLoader.load(protocol.id);
        // If username is null here, something is reeaally fucky
        f.createdBy = await ctx.userDataLoader.load(f.createdBy?.username ?? '');
        return f;
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