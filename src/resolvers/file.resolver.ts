import FileAPI from '../api/file.api';
import { useDataLoader } from '../dataloaders';
import { BadRequestError } from '../errors/RequestErrors';
import { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { fileReduce } from '../reducers/file.reducer';

const fileApi = new FileAPI();

const filesResolver: Resolvers = {
  File: {
    createdBy: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.createdBy.username,
    })),
  },
  Query: {
    files: async (_, { type }) => {
      const files = await fileApi.getMultipleFiles(type ?? undefined);

      if (!files) {
        return [];
      }

      return reduce(files, fileReduce);
    },
    file: async (_, { id }) => {
      const filedata = await fileApi.getFileData(id);

      return reduce(filedata, fileReduce);
    },
    fileSystem: async (_, { folder }) => {
      const [files, path] = await fileApi.getFolderData(folder);

      return {
        files: reduce(files, fileReduce),
        path,
      };
    },
    searchFiles: async (_, { search }) => {
      // If no search query
      if (!search) {
        throw new BadRequestError('Du måste ange en söksträng');
      }
      const files = await fileApi.searchFiles(search);
      return reduce(files, fileReduce);
    },
  },
  Mutation: {
    deleteFile: async (_, { id }) => {
      await fileApi.deleteFile(id);
      return true;
    },
    createFolder: async (_, { path, name }, { getUsername }) => {
      const username = getUsername();

      const created = await fileApi.createFolder(path, name, username);
      return !!created;
    },
  },
};

export default filesResolver;
