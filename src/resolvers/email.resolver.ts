import { hasAccess } from '@/util';
import { Feature, Resolvers } from '@generated/graphql';
import { sendEmail } from '@service/email';

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
