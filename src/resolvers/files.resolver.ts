import FilesAPI from '../api/files.api';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';
import { hydrateFiles as reduce } from '../reducers/file.reducer';

const filesAPI = new FilesAPI();

const filesResolver: Resolvers = {
  File: {
    createdBy: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.createdBy.username,
    })),
  },
  Query: {
    files: async (_, { type }) => {
      const files = await filesAPI.getMultipleFiles(type ?? undefined);

      if (!files) {
        return [];
      }

      return reduce(files);
    },
    file: async (_, { id }) => {
      const filedata = await filesAPI.getFileData(id);

      if (!filedata) {
        return null;
      }

      return reduce(filedata);
    },
    fileSystem: async (_, { folder }) => reduce(await filesAPI.getFolderData(folder)),
  },
  Mutation: {
    deleteFile: async (_, { id }) => filesAPI.deleteFile(id),
    createFolder: async (_, { path, name }) => filesAPI.createFolder(path, name, 'aa0000bb-s'),
  },
};

export default filesResolver;
