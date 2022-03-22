import apolloServerConfig from '@/app/serverconfig';
import { ApolloServer } from 'apollo-server-express';

/**
 * Creates an apolloserver
 * @param Apolloconfig
 */
export const getApolloServer = () => new ApolloServer(apolloServerConfig);
