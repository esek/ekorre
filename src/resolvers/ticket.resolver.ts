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
      const tickets = await tikcketApi.getTickets(activityID);

      return reduce(tickets, ticketReducer);
    },
  },
  Mutation: {
    addTicket: async (_, { ticket }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const addedTicket = await tikcketApi.addTicket(ticket);
      return ticketReducer(addedTicket);
    },

    modifyTicket: async (_, { id, entry }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const modifiedTicket = await tikcketApi.modifyTicket(id, entry);
      return ticketReducer(modifiedTicket);
    },

    removeTicket: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const removedTicket = await tikcketApi.removeTicket(id);
      return ticketReducer(removedTicket);
    },
  },
};

export default ticketResolver;
