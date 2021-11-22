import FilesAPI from '../api/files.api';
import { useDataLoader } from '../dataloaders';
import { BadRequestError } from '../errors/RequestErrors';
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
    searchFiles: async (_, { search }) => {
      // If no search query
      if (!search) {
        throw new BadRequestError('Du måste ange en söksträng');
      }
      const files = await filesAPI.searchFiles(search);
      return reduce(files, fileReduce);
    },
  },
  Mutation: {
    deleteFile: async (_, { id }) => {
      await filesAPI.deleteFile(id);
      return true;
    },
    createFolder: async (_, { path, name }, { getUser }) => {
      const user = getUser();
      const created = await filesAPI.createFolder(path, name, user.username);
      return !!created;
    },
  },
};

export default filesResolver;
