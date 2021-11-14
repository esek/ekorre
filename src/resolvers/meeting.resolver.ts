import { MeetingAPI } from '../api/meeting.api';
import type { Resolvers } from '../graphql.generated';

const api = new MeetingAPI();

const meetingResolver: Resolvers = {
  Query: {

  },
  Mutation: {

  },
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
};

export default meetingResolver;