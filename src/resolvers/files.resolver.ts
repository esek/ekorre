import FilesAPI from '../api/files.api';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';
import { formatUrl } from '../reducers/file.reducer';

const filesAPI = new FilesAPI();

const filesResolver: Resolvers = {
  FileSystemNode: {
    createdBy: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.createdBy.username,
    })),
  },
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

      return formatUrl(files);
    },
    file: async (_, { id, name }) => {
      let filedata;
      if (id) {
        filedata = await filesAPI.getFileData(id);
      } else if (name) {
        filedata = await filesAPI.getFileFromName(name);
      }

      if (!filedata) {
        return null;
      }

      return formatUrl(filedata);
    },
    fileSystem: async (_, { folder }) => filesAPI.getFolderData(folder),
  },
  Mutation: {
    deleteFile: async (_, { id }) => filesAPI.deleteFile(id),
  },
};

export default filesResolver;
