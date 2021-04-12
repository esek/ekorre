import FilesAPI from '../api/files.api';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';

const filesAPI = new FilesAPI();

const filesResolver: Resolvers = {
  File: {
    uploadedBy: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.uploadedBy.username,
    })),
  },
  Query: {
    files: async (_, { type }) => {
      const files = await filesAPI.getMultipleFiles(type ?? undefined);

      if (!files) {
        return [];
      }

      return files.map((f) => ({ uploadedBy: { username: f.refuploader }, ...f }));
    },
    file: async (_, { id }) => {
      const filedata = await filesAPI.getFileData(id);
      if (!filedata) {
        return null;
      }

      const { refuploader, ...reduced } = filedata;

      return {
        ...reduced,
        uploadedBy: {
          username: refuploader,
        },
      };
    },
  },
  Mutation: {
    deleteFile: async (_, { id }) => filesAPI.deleteFile(id),
  },
};

export default filesResolver;
