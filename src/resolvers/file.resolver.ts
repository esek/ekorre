import { useDataLoader } from '@/dataloaders';
import { BadRequestError } from '@/errors/request.errors';
import { reduce } from '@/reducers';
import { hasAccess } from '@/util';
import FileAPI from '@api/file';
import { Feature, Resolvers } from '@generated/graphql';
import { fileReduce } from '@reducer/file';

const fileApi = new FileAPI();

const filesResolver: Resolvers = {
  File: {
    createdBy: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.createdBy.username,
    })),
  },
  Query: {
    files: async (_, { type }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      const files = await fileApi.getMultipleFiles(type ?? undefined);

      return reduce(files, fileReduce);
    },
    file: async (_, { id }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      const filedata = await fileApi.getFileData(id);

      return reduce(filedata, fileReduce);
    },
    fileSystem: async (_, { folder }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      const [files, path] = await fileApi.getFolderData(folder);

      return {
        files: reduce(files, fileReduce),
        path,
      };
    },
    searchFiles: async (_, { search }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      // If no search query
      if (!search) {
        throw new BadRequestError('Du måste ange en söksträng');
      }
      const files = await fileApi.searchFiles(search);
      return reduce(files, fileReduce);
    },
  },
  Mutation: {
    deleteFile: async (_, { id }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      await fileApi.deleteFile(id);
      return true;
    },
    createFolder: async (_, { path, name }, ctx) => {
      hasAccess(ctx, Feature.FilesAdmin);
      const username = ctx.getUsername();

      const created = await fileApi.createFolder(path, name, username);
      return !!created;
    },
  },
};

export default filesResolver;
