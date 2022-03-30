import { ApiKeyResponse } from '@/models/mappers';
import { DatabaseApiKey } from '@db/apikey';

import { accessReducer } from './access.reducer';

export const apiKeyReducer = (model: DatabaseApiKey): ApiKeyResponse => {
  return {
    key: model.key,
    description: model.description ?? '',
    access: accessReducer([]),
    creator: {
      username: model.refcreator,
    },
  };
};
