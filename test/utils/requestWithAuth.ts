import { app } from '@/app/app';
import { StrictObject } from '@/models/base';
import { GraphqlResponseData } from '@test/models/test';
import request from 'supertest';

const r = request(app);

/**
 * Sends GraphQL query/mutation, using `supertest`, allowing coverage information to be collected.
 * Useful when endpoints use `ctx.getUsername()` to complete requests
 * @param query GraphQL query OR mutation
 * @param variables Variables to be used in query
 * @param accessToken Accesstoken, as issued by `issueToken()`
 * @returns Body of the response
 */
const requestWithAuth = async (
  query: string,
  variables: StrictObject,
  accessToken: string,
): Promise<GraphqlResponseData> => {
  const res = await r
    .post('/')
    .set('Accept', 'application/json')
    .set({ Authorization: `Bearer ${accessToken}` })
    .send({ query, variables });

  return res?.body as GraphqlResponseData;
};

export default requestWithAuth;
