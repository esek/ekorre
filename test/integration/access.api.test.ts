import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { AccessInput, AccessResourceType, Door, Feature } from '@generated/graphql';
import { PrismaApiKeyAccess, PrismaIndividualAccess } from '@prisma/client';

type UnionPrismaAccess = PrismaIndividualAccess & PrismaApiKeyAccess;

const accessApi = new AccessAPI();
const userApi = new UserAPI();
const apiKeyApi = new ApiKeyAPI();

const username0 = 'te0000st-s';
const username1 = 'te1111st-s';

let apiKey: string;

beforeAll(async () => {
  await accessApi.clear();
  await apiKeyApi.clear();
  await userApi.clear();

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

afterAll(async () => {
  await accessApi.clear();
  await apiKeyApi.clear();
  await userApi.clear();
});

const setGetTest = async (
  setCall: () => Promise<boolean>,
  getCall: () => Promise<Partial<UnionPrismaAccess>[]>,
  expected: Partial<UnionPrismaAccess>[],
) => {
  const res = await setCall();
  expect(res).toBe(true);

  const accessGotten = await getCall();
  expect(accessGotten.length).toBe(expected.length);

  for (let i = 0; i < expected.length; i += 1) {
    expect(accessGotten[i]).toMatchObject(expected[i]);
  }
};

const accessSingleInput: AccessInput = {
  doors: [Door.Bd],
  features: [Feature.AccessAdmin],
};

const expectedAccessSingleInput: Partial<UnionPrismaAccess>[] = [
  {
    resource: Feature.AccessAdmin,
    resourceType: AccessResourceType.Feature,
  },
  {
    resource: Door.Bd,
    resourceType: AccessResourceType.Door,
  },
];

const otherAccessSingleInput: AccessInput = {
  doors: [Door.Hk],
  features: [Feature.Superadmin],
};

const expectedAccessOtherSingleInput: Partial<UnionPrismaAccess>[] = [
  {
    resource: Door.Hk,
    resourceType: AccessResourceType.Door,
  },
  {
    resource: Feature.Superadmin,
    resourceType: AccessResourceType.Feature,
  },
];

const accessMultipleInput: AccessInput = {
  doors: [Door.Bd, Door.Hk],
  features: [Feature.AccessAdmin, Feature.Superadmin],
};

const expectedAccessMultipleInput: Partial<UnionPrismaAccess>[] = [
  {
    resource: Feature.AccessAdmin,
    resourceType: AccessResourceType.Feature,
  },
  {
    resource: Door.Bd,
    resourceType: AccessResourceType.Door,
  },
  {
    resource: Door.Hk,
    resourceType: AccessResourceType.Door,
  },
  {
    resource: Feature.Superadmin,
    resourceType: AccessResourceType.Feature,
  },
];

const emptyAccess: AccessInput = { doors: [], features: [] };

const accessWithUnkownFeature: AccessInput = {
  doors: [],
  features: [Feature.Superadmin, 'unknown' as Feature],
};

const accessWithUnkownDoor: AccessInput = {
  doors: [Door.Bd, 'unknown' as Door],
  features: [],
};

describe('setting/getting access for user', () => {
  const mapAccess = (access: Partial<UnionPrismaAccess>[], refUser: string = username0) =>
    access.map((a) => ({ ...a, refUser }));
  const setAccess =
    (input: AccessInput, username = username0) =>
    () =>
      accessApi.setIndividualAccess(username, input);
  const getAccess = (username = username0) => accessApi.getIndividualAccess(username);

  it('setting single access', async () => {
    const expectedAccess = mapAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleInput), getAccess, expectedAccess);
  });

  it('changing access', async () => {
    const expectedAccess = mapAccess(expectedAccessOtherSingleInput);

    await setGetTest(setAccess(otherAccessSingleInput), getAccess, expectedAccess);
  });

  it('setting access with multiple features', async () => {
    const expectedAccess = mapAccess(expectedAccessMultipleInput);

    await setGetTest(setAccess(accessMultipleInput), getAccess, expectedAccess);
  });

  it('removing access', async () => {
    await setGetTest(setAccess(emptyAccess), getAccess, []);
  });

  it('setting access for unkown', async () => {
    await expect(setAccess(accessSingleInput, 'unknown')).rejects.toThrowError();
  });

  it('setting access with invalid feature', async () => {
    await expect(setAccess(accessWithUnkownFeature)).rejects.toThrowError();
  });

  it('setting access with invalid door', async () => {
    await expect(setAccess(accessWithUnkownDoor)).rejects.toThrowError();
  });

  it('getting access for unkown', async () => {
    expect(await getAccess('unknown')).toEqual([]);
  });
});

describe('setting/getting access for apikey', () => {
  const mapAccess = (access: Partial<UnionPrismaAccess>[], refApiKey: string = apiKey) =>
    access.map((a) => ({ ...a, refApiKey }));
  const setAccess =
    (input: AccessInput, apikey = apiKey) =>
    () =>
      accessApi.setApiKeyAccess(apikey, input);
  const getAccess = (apikey = apiKey) => accessApi.getApiKeyAccess(apikey);

  it('setting single access', async () => {
    const expectedAccess = mapAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleInput), getAccess, expectedAccess);
  });

  it('changing access', async () => {
    const expectedAccess = mapAccess(expectedAccessOtherSingleInput);

    await setGetTest(setAccess(otherAccessSingleInput), getAccess, expectedAccess);
  });

  it('setting access with multiple features', async () => {
    const expectedAccess = mapAccess(expectedAccessMultipleInput);

    await setGetTest(setAccess(accessMultipleInput), getAccess, expectedAccess);
  });

  it('removing access', async () => {
    await setGetTest(setAccess(emptyAccess), getAccess, []);
  });

  it('setting access for unkown', async () => {
    await expect(setAccess(accessSingleInput, 'unknown')).rejects.toThrowError();
  });

  it('setting access with invalid feature', async () => {
    await expect(setAccess(accessWithUnkownFeature)).rejects.toThrowError();
  });

  it('setting access with invalid door', async () => {
    await expect(setAccess(accessWithUnkownDoor)).rejects.toThrowError();
  });

  it('getting access for unkown', async () => {
    expect(await getAccess('unknown')).toEqual([]);
  });
});
