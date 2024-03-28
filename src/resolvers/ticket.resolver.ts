import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { TicketAPI } from '@api/ticket';
import { Feature, Resolvers } from '@generated/graphql';
import { ticketReducer } from '@reducer/ticket';

const tikcketApi = new TicketAPI();

const ticketResolver: Resolvers = {
  Query: {
    ticket: async (_, { id }, ctx) => {
      await hasAuthenticated(ctx);
      const ticket = await tikcketApi.getTicket(id);

      return ticketReducer(ticket);
    },
    tickets: async (_, { activityID }, ctx) => {
      await hasAuthenticated(ctx);
      const t = await tikcketApi.getTickets(activityID);

      return reduce(t, ticketReducer);
    },
  },
  Mutation: {
    addTicket: async (_, { ticket }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const t = await tikcketApi.addTicket(ticket);
      return ticketReducer(t);
    },

    modifyTicket: async (_, { id, entry }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const t = await tikcketApi.modifyTicket(id, entry);
      return ticketReducer(t);
    },

    removeTicket: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const t = await tikcketApi.removeTicket(id);
      return ticketReducer(t);
    },
  },
};

export default ticketResolver;
