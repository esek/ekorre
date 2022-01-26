import apolloServerConfig from '@/app/serverconfig';
import { ApolloServer } from 'apollo-server-express';

interface IApolloServerConfig {
  username?: string;
}

/**
 * Creates an apolloserver
 * If passed, a specific username will be used for the `getUsername` context so that login is not required all the time
 * @param Apolloconfig
 */
export const getApolloServer = ({ username }: IApolloServerConfig = {}) => {
  const apolloServer = new ApolloServer({
    ...apolloServerConfig,
    context: (props) => {
      if (typeof apolloServerConfig.context === 'function') {
        return {
          ...(apolloServerConfig.context(props) as Record<string, unknown>),
          getUsername: () => username,
        };
      }

      return {};
    },
  });

  return apolloServer;
};
