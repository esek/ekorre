import { Resolvers } from '@generated/graphql';
import { sendEmail } from '@service/email';

const emailResolver: Resolvers = {
  Mutation: {
    sendEmail: async (_, { options }) => {
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
