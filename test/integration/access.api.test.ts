import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { PostAPI } from '@api/post';
import { UserAPI } from '@api/user';
import {
  AccessInput,
  AccessResourceType,
  Door,
  Feature,
  PostType,
  Utskott,
} from '@generated/graphql';
import { PrismaApiKeyAccess, PrismaIndividualAccess } from '@prisma/client';

type UnionPrismaAccess = PrismaIndividualAccess & PrismaApiKeyAccess;

const accessApi = new AccessAPI();
const userApi = new UserAPI();
const apiKeyApi = new ApiKeyAPI();
const postApi = new PostAPI();

const username0 = 'te0000st-s';
const username1 = 'te1111st-s';

let apiKey: string;
let postId0: number;

beforeAll(async () => {
  await postApi.clear();
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

  const p1 = postApi.createPost({
    name: 'Test',
    description: 'Test',
    spots: 1,
    postType: PostType.ExactN,
    utskott: Utskott.Infu,
  });

  const [, , postNumber1] = await Promise.all([c1, c2, p1]);

  postId0 = postNumber1;

  const key = await apiKeyApi.createApiKey('Test API key', username0);

  apiKey = key;
});

afterAll(async () => {
  await accessApi.clear();
  await postApi.clear();
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

describe('setting/getting access for post', () => {
  beforeAll(async () => {
    await accessApi.clear();
    await postApi.addUsersToPost([username0], postId0);
  });

  afterAll(async () => {
    await postApi.clearHistory();
  });

  const mapAccess = (access: Partial<UnionPrismaAccess>[], refPost: number = postId0) =>
    access.map((a) => ({ ...a, refPost }));
  const setAccess =
    (input: AccessInput, postId = postId0) =>
    () =>
      accessApi.setPostAccess(postId, input);
  const getAccess = (postId = postId0) => accessApi.getPostAccess(postId);

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
    await expect(setAccess(accessSingleInput, -1)).rejects.toThrowError();
  });

  it('setting access with invalid feature', async () => {
    await expect(setAccess(accessWithUnkownFeature)).rejects.toThrowError();
  });

  it('setting access with invalid door', async () => {
    await expect(setAccess(accessWithUnkownDoor)).rejects.toThrowError();
  });

  it('getting access for unkown', async () => {
    expect(await getAccess(-1)).toEqual([]);
  });
});

describe('getting combined access', () => {
  beforeAll(async () => {
    await postApi.clearHistory();

    await postApi.addUsersToPost([username0], postId0);
  });

  const mapAccess = (access: Partial<UnionPrismaAccess>[], refUser: string = username0) =>
    access.map((a) => ({ ...a, refUser }));
  const getAccess = (username = username0) => accessApi.getUserFullAccess(username);

  it('getting combined access for user', async () => {
    const setAccessFunc = async () => {
      const a1 = accessApi.setIndividualAccess(username0, accessSingleInput);
      const a2 = accessApi.setPostAccess(postId0, otherAccessSingleInput);

      const [r1, r2] = await Promise.all([a1, a2]);

      return r1 && r2;
    };

    const expectedAccess1 = mapAccess(expectedAccessSingleInput);
    const expectedAccess2 = mapAccess(expectedAccessOtherSingleInput);

    const expectedAccess = [...expectedAccess1, ...expectedAccess2].sort(
      (a, b) => a.resource?.localeCompare(b.resource ?? '') ?? 0,
    );

    await setGetTest(setAccessFunc, getAccess, expectedAccess);
  });

  it('getting combined access for unkown', async () => {
    expect(await accessApi.getUserFullAccess('unknown')).toEqual([]);
  });
});
