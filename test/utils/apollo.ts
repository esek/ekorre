import apolloServerConfig from '@/app/serverconfig';
import { ApolloServer } from 'apollo-server-express';

interface IApolloServerConfig {
  username?: string;
}

export const getApolloServer = ({ username = 'aa0000bb-s' }: IApolloServerConfig = {}) => {
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
