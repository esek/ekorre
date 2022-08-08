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
      await hasAccess(ctx, Feature.FilesAdmin);
      const files = await fileApi.getMultipleFiles(type ?? undefined);

      return reduce(files, fileReduce);
    },
    file: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.FilesAdmin);
      const f = await ctx.fileDataLoader.load(id);
      return f;
    },
    fileSystem: async (_, { folder }, ctx) => {
      await hasAccess(ctx, Feature.FilesAdmin);
      const [files, path] = await fileApi.getFolderData(folder);

      return {
        files: reduce(files, fileReduce),
        path,
      };
    },
    searchFiles: async (_, { search }, ctx) => {
      await hasAccess(ctx, Feature.FilesAdmin);
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
      await hasAccess(ctx, Feature.FilesAdmin);
      await fileApi.deleteFile(id);
      return true;
    },
    createFolder: async (_, { path, name }, ctx) => {
      await hasAccess(ctx, Feature.FilesAdmin);
      const username = ctx.getUsername();

      const created = await fileApi.createFolder(path, name, username);
      return reduce(created, fileReduce);
    },
  },
};

export default filesResolver;
