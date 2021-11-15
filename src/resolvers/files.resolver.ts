import FilesAPI from '../api/files.api';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { fileReduce } from '../reducers/file.reducer';

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

      return reduce(files, fileReduce);
    },
    file: async (_, { id }) => {
      const filedata = await filesAPI.getFileData(id);

      return reduce(filedata, fileReduce);
    },
    fileSystem: async (_, { folder }) => {
      const [files, path] = await filesAPI.getFolderData(folder);

      return {
        files: reduce(files, fileReduce),
        path,
      };
    },
  },
  Mutation: {
    deleteFile: async (_, { id }) => {
      await filesAPI.deleteFile(id);
      return true;
    },
    createFolder: async (_, { path, name }, { getUsername }) => {
      const username = getUsername();
      const created = await filesAPI.createFolder(path, name, username);
      return !!created;
    },
  },
};

export default filesResolver;
