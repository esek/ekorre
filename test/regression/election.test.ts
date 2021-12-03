import axios, { AxiosRequestConfig } from 'axios';

import { Election } from '../../src/graphql.generated';
import { RequestErrorResponse } from '../../src/errors/RequestErrors';


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

const CREATE_ELECTION_QUERY = `
  mutation {
    createElection(electables: ["Macapär"], nominationsHidden: false)
  }
`;

const OPEN_ELECTION_QUERY = `
  {
    openElection {
      id
      electables {
        postname
      }
      proposals {
        user {
          username
        }
      }
      nominations {
        user {
          username
        }
        post {
          postname
        }
      }
    }
  }
`;

const NOMINATION_QUERY = `
  nom
`;

test('getting nominations when nominations are hidden', async () => {
  console.log('TODO: THis');
  expect(true).toBeTruthy();
});