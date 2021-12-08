import axios, { AxiosRequestConfig } from 'axios';

import { RequestErrorResponse } from '../../src/errors/RequestErrors';
import { Election } from '../../src/graphql.generated';

interface ElectionResponse {
  headers: {
    'set-cookie': string[] | undefined;
    [key: string]: any;
  };
  data: {
    data: {
      openElection: Partial<Election>;
      [key: string]: any;
    };
    errors?: RequestErrorResponse[];
  };
}

test.todo('getting nominations when nominations are hidden');
