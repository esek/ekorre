import { EventAPI } from '@api/event';
import { Feature, Resolvers } from '@generated/graphql';
import { eventReducer } from '@reducer/event';
import { reduce } from '@/reducers';
import { Event } from '@generated/graphql';
import { query } from 'express';
const api = new EventAPI()



const eventResolver: Resolvers = {
  Mutation: {
    addEvent: async (_, { entry }, ctx) => {
      const event = await api.createEvent(entry)
      return reduce(event, eventReducer)
    },
    },
  Query: {
    eventEntries: async (_, { limit }) => {
      const events = await api.getAllEvents()
      return reduce(events, eventReducer)
    }
  }
}

export default eventResolver




/**
 * 
 * addArticle: async (_, { entry }, ctx) => {
      await checkEditAccess(ctx, entry.articleType);
      // Special type of reduce
      const apiResponse = await articleApi.newArticle(ctx.getUsername(), entry);
      return reduce(apiResponse, articleReducer);
    },
 * 
 * 
const emailResolver: Resolvers = {
  Mutation: {
    sendEmail: async (_, { options }, ctx) => {
      if (!options.to.every((s) => s.endsWith('esek.se'))) {
        await hasAccess(ctx, Feature.EmailAdmin);
      }

      const resp = await sendEmail(
        options.to,
        options.subject,
        options.template ?? '',
        options.overrides ?? {},
        options.body ?? '',
      );

      return resp.status === 200;
    },
  },
};

export default emailResolver;
*/