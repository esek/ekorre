import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { AccessInput, AccessResourceType, Feature } from '@generated/graphql';
import { PrismaApiKeyAccess, PrismaIndividualAccess } from '@prisma/client';

type UnionPrismaAccess = PrismaIndividualAccess & PrismaApiKeyAccess;

const accessApi = new AccessAPI();
const userApi = new UserAPI();
const apiKeyApi = new ApiKeyAPI();

const username0 = 'te0000st-s';
const username1 = 'te1111st-s';

let apiKey: string;

beforeAll(async () => {
  await Promise.all([userApi.clear(), apiKeyApi.clear()]);

  const c1 = userApi.createUser({
    username: username0,
    password: 'test',
    firstName: 'Test',
    lastName: 'Testsson',
    class: 'EXX',
  });

  const c2 = userApi.createUser({
    username: username1,
    password: 'test',
    firstName: 'Testina',
    lastName: 'Testsson',
    class: 'EXX',
  });

  await Promise.all([c1, c2]);

  const key = await apiKeyApi.createApiKey('Test API key', username0);

  apiKey = key;
});

beforeAll(async () => {
  await accessApi.clear();
});

const setGetTest = async (setCall: (a: AccessInput) => Promise<boolean>, getCall: () => Promise<Partial<UnionPrismaAccess>[]>, access: AccessInput, expected: Partial<UnionPrismaAccess>[]) => {
  const res = await setCall(access);
  expect(res).toBe(true);

  const accessGotten = await getCall();
  expect(accessGotten.length).toBe(expected.length);

  for (let i = 0; i < expected.length; i += 1) {
    expect(accessGotten[i]).toMatchObject(expected[i]);
  }
};

describe('setting/getting access for user', () => {
  test('setting access for user', async () => {
    const access: AccessInput = {
      doors: [],
      features: [Feature.AccessAdmin],
    };

    const expectedAccess: Partial<PrismaIndividualAccess> = {
      refUser: username0,
      resource: Feature.AccessAdmin,
      resourceType: AccessResourceType.Feature,
    };

    await setGetTest((a) => accessApi.setIndividualAccess(username0, a), () => accessApi.getIndividualAccess(username0), access, [expectedAccess]);
  });

  test('setting access for user with multiple features', async () => {
    await accessApi.clear();

    const access: AccessInput = {
      doors: [],
      features: [Feature.AccessAdmin, Feature.Superadmin],
    };

    const expectedAccess: Partial<PrismaIndividualAccess>[] = [
      {
        refUser: username0,
        resource: Feature.AccessAdmin,
        resourceType: AccessResourceType.Feature,
      },
      {
        refUser: username0,
        resource: Feature.Superadmin,
        resourceType: AccessResourceType.Feature,
      },
    ];

    await setGetTest((a) => accessApi.setIndividualAccess(username0, a), () => accessApi.getIndividualAccess(username0), access, expectedAccess);
  });

  test('removing access for user', async () => {
    const access: AccessInput = { doors: [], features: [] };

    await setGetTest((a) => accessApi.setIndividualAccess(username0, a), () => accessApi.getIndividualAccess(username0), access, []);
  });
});

describe('setting/getting access for apiKey', () => {
  test('setting access for apiKey', async () => {
    const access: AccessInput = {
      doors: [],
      features: [Feature.AccessAdmin],
    };

    const expectedAccess: Partial<PrismaApiKeyAccess> = {
      refApiKey: apiKey,
      resource: Feature.AccessAdmin,
      resourceType: AccessResourceType.Feature,
    };

    await setGetTest((a) => accessApi.setApiKeyAccess(apiKey, a), () => accessApi.getApiKeyAccess(apiKey), access, [expectedAccess]);
  });

  test('setting access for key with multiple features', async () => {
    await accessApi.clear();

    const access: AccessInput = {
      doors: [],
      features: [Feature.AccessAdmin, Feature.Superadmin],
    };

    const expectedAccess: Partial<PrismaApiKeyAccess>[] = [
      {
        refApiKey: apiKey,
        resource: Feature.AccessAdmin,
        resourceType: AccessResourceType.Feature,
      },
      {
        refApiKey: apiKey,
        resource: Feature.Superadmin,
        resourceType: AccessResourceType.Feature,
      },
    ];

    await setGetTest((a) => accessApi.setApiKeyAccess(apiKey, a), () => accessApi.getApiKeyAccess(apiKey), access, expectedAccess);
  });

  test('removing access for user', async () => {
    const access: AccessInput = { doors: [], features: [] };

    await setGetTest((a) => accessApi.setApiKeyAccess(apiKey, a), () => accessApi.getApiKeyAccess(apiKey), access, []);
  });
});