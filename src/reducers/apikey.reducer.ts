import { ApiKeyResponse } from '@/models/mappers';
import { PrismaApiKey } from '@prisma/client';

import { accessReducer } from './access.reducer';

export const apiKeyReducer = (model: PrismaApiKey): ApiKeyResponse => {
  return {
    key: model.key,
    description: model.description ?? '',
    access: accessReducer([]),
    creator: {
      username: model.refCreator
    },
  };
};
