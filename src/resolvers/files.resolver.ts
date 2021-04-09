import FilesAPI from '../api/files.api';
import { Resolvers } from '../graphql.generated';

const filesAPI = new FilesAPI();

const filesResolver: Resolvers = {
  Query: {},
  Mutation: {
    deleteFile: async (_, { id }) => await filesAPI.deleteFile(id),
  },
};

export default filesResolver;
