import { ApiKeyResponse } from '@/models/mappers';
import { DatabaseApiKey } from '@db/apikey';

import { accessReducer } from './access.reducer';

export const apiKeyReducer = (model: DatabaseApiKey): ApiKeyResponse => {
  return {
    id: model.id,
    key: model.key,
    access: accessReducer([]),
    creator: {
      username: model.refcreator,
    },
  };
};
