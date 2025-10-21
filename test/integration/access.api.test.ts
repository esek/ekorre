import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { PostAPI } from '@api/post';
import { UserAPI } from '@api/user';
import {
  AccessEndDateInput,
  AccessInput,
  AccessLogIndividualAccess,
  AccessLogPost,
  AccessResourceType,
  Door,
  Feature,
  PostType,
  Utskott,
} from '@generated/graphql';
import {
  PrismaApiKeyAccess,
  PrismaIndividualAccess,
  PrismaIndividualAccessLog,
  PrismaPostAccess,
} from '@prisma/client';
import { getRandomUsername } from '@test/utils/utils';

// This test is in integrations because it dependes on many other units and is hard
// to unit test.

type UnionPrismaAccess = PrismaIndividualAccess & PrismaPostAccess & PrismaApiKeyAccess;

const accessApi = new AccessAPI();
const userApi = new UserAPI();
const apiKeyApi = new ApiKeyAPI();
const postApi = new PostAPI();

const username0 = getRandomUsername();
const username1 = getRandomUsername();

let apiKey: string;
let postId0: number;

beforeAll(async () => {
  const clearUser0 = accessApi.clearAccessForUser(username0);
  const clearUser1 = accessApi.clearAccessForUser(username1);

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

  const [post1] = await Promise.all([
    p1,
    clearUser0,
    clearUser1,
    c1,
    c2,
    accessApi.clearIndividualAccessLog(),
    accessApi.clearPostAccessLog(),
  ]);

  postId0 = post1.id;

  const key = await apiKeyApi.createApiKey('Test API key', username0);

  apiKey = key;
});

afterAll(async () => {
  const clearUser0 = accessApi.clearAccessForUser(username0);
  const clearUser1 = accessApi.clearAccessForUser(username1);
  await Promise.all([
    clearUser0,
    clearUser1,
    accessApi.clearIndividualAccessLog(),
    accessApi.clearPostAccessLog(),
  ]);

  await postApi.deletePost(postId0);
  await apiKeyApi.removeApiKey(apiKey);
  await userApi.deleteUser(username0);
  await userApi.deleteUser(username1);
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

// #region Expected values

const accessSingleInput: AccessEndDateInput = {
  doorEndDates: [{ resource:Door.Bd, endDate:null}],
  featureEndDates:[{ resource:Feature.AccessAdmin, endDate:null}],
};

const accessSingleNoEndDateInput: AccessInput = {
  doors: [Door.Bd],
  features: [Feature.AccessAdmin],
};

const accessSingleFutureEndDateInput: AccessEndDateInput = {
  doorEndDates: [{ resource:Door.Bd, endDate: new Date(9999,11,31)}],
  featureEndDates:[{ resource:Feature.AccessAdmin, endDate: new Date(9999,11,31)}],
};

const accessSinglePastEndDateInput: AccessEndDateInput = {
  doorEndDates: [{ resource:Door.Bd, endDate: new Date(2000,0,1)}],
  featureEndDates:[{ resource:Feature.AccessAdmin, endDate: new Date(2000,0,1)}],
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

const otherAccessSingleInput: AccessEndDateInput = {
  doorEndDates: [{ resource:Door.Hk, endDate:null}],
  featureEndDates:[{ resource:Feature.Superadmin, endDate:null}],
};

const otheraccessSingleNoEndDateInput: AccessInput = {
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

const accessMultipleInput: AccessEndDateInput = {
  doorEndDates: [{resource:Door.Bd, endDate:null}, {resource:Door.Hk, endDate:null}],
  featureEndDates:[{resource:Feature.AccessAdmin, endDate:null}, {resource:Feature.Superadmin, endDate:null}],
};

const accessMultipleNoEndDateInput: AccessInput = {
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

const emptyAccess: AccessEndDateInput = { 
  doorEndDates: [],
  featureEndDates:[],
};

const emptyNoEndDateAccess: AccessInput = { doors: [], features: [] };

const accessWithUnkownFeature: AccessEndDateInput = {
  doorEndDates: [],
  featureEndDates:[{resource:Feature.Superadmin, endDate:null}, {resource:'unknown' as Feature, endDate:null}],
};

const accessWithUnkownFeatureNoEndDate: AccessInput = {
  doors: [],
  features: [Feature.Superadmin, 'unknown' as Feature],
};

const accessWithUnkownDoor: AccessEndDateInput = {
  doorEndDates: [{resource:Door.Bd, endDate:null}, {resource:'unknown' as Door, endDate:null}],
  featureEndDates:[],
};

const accessWithUnkownDoorNoEndDate: AccessInput = {
  doors: [Door.Bd, 'unknown' as Door],
  features: [],
};

// #endregion

const mapUserAccess = (access: Partial<UnionPrismaAccess>[], refUser: string = username0) =>
  access.map((a) => ({ ...a, refUser }));
const mapPostAccess = (access: Partial<UnionPrismaAccess>[], refPost: number = postId0) =>
  access.map((a) => ({ ...a, refPost }));
const mapApiKeyAccess = (access: Partial<UnionPrismaAccess>[], refApiKey: string = apiKey) =>
  access.map((a) => ({ ...a, refApiKey }));

function mapIndividualAccessToSingleInput(access: PrismaIndividualAccess[]): AccessInput {
  return access.reduce(
    (accum: AccessInput, currentValue: PrismaIndividualAccess) => {
      if (currentValue.resourceType == 'door') {
        accum.doors.push(currentValue.resource as Door);
      } else {
        accum.features.push(currentValue.resource as Feature);
      }
      return accum;
    },
    {
      doors: [],
      features: [],
    },
  );
}

async function addUserWithAccessThenCheckAllUsersWithAccess() {
  const usernameTest = 'po7853sj-s';
  await userApi.createUser({
    username: usernameTest,
    password: 'supersecretpassword',
    firstName: 'Pontus',
    lastName: 'SjöSjöstedt',
    class: 'E21',
  });
  await accessApi.setIndividualAccess(usernameTest, accessSingleInput, username1);
  const users = await userApi.getUsersWithIndividualAccess();
  const testUser = users.find((user) => user.username == usernameTest);
  await userApi.deleteUser(usernameTest);
  expect(
    mapIndividualAccessToSingleInput(testUser?.access as PrismaIndividualAccess[]),
  ).toStrictEqual(accessSingleNoEndDateInput);
}

test(
  'Try creating user and seeing that their access is properly returned',
  addUserWithAccessThenCheckAllUsersWithAccess,
);

describe('setting/getting access for user', () => {
  const setAccess =
    (input: AccessEndDateInput, username = username0) =>
    () =>
      accessApi.setIndividualAccess(username, input, username0);
  const getAccess = (username = username0) => accessApi.getIndividualAccess(username);
  it('setting single access', async () => {
    const expectedAccess = mapUserAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleInput), getAccess, expectedAccess);
  });

  it('changing access', async () => {
    const expectedAccess = mapUserAccess(expectedAccessOtherSingleInput);

    await setGetTest(setAccess(otherAccessSingleInput), getAccess, expectedAccess);
  });

  it('setting access with multiple features', async () => {
    const expectedAccess = mapUserAccess(expectedAccessMultipleInput);

    await setGetTest(setAccess(accessMultipleInput), getAccess, expectedAccess);
  });

  it('setting single access with future end date', async () => {
    const expectedAccess = mapUserAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleFutureEndDateInput), getAccess, expectedAccess);
  });

  it('removing access', async () => {
    await setGetTest(setAccess(emptyAccess), getAccess, []);
  });

    it('setting single access with future end date', async () => {
    await setGetTest(setAccess(accessSinglePastEndDateInput), getAccess, []);
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

  it('setting access with invalid end date', async () => {
    await expect(setAccess(accessWithUnkownDoor)).rejects.toThrowError();
  });

  it('getting access for unkown', async () => {
    expect(await getAccess('unknown')).toEqual([]);
  });
});

describe('setting/getting access for apikey', () => {
  const setAccess =
    (input: AccessInput, apikey = apiKey) =>
    () =>
      accessApi.setApiKeyAccess(apikey, input);
  const getAccess = (apikey = apiKey) => accessApi.getApiKeyAccess(apikey);

  it('setting single access', async () => {
    const expectedAccess = mapApiKeyAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleNoEndDateInput), getAccess, expectedAccess);
  });

  it('changing access', async () => {
    const expectedAccess = mapApiKeyAccess(expectedAccessOtherSingleInput);

    await setGetTest(setAccess(otheraccessSingleNoEndDateInput), getAccess, expectedAccess);
  });

  it('setting access with multiple features', async () => {
    const expectedAccess = mapApiKeyAccess(expectedAccessMultipleInput);

    await setGetTest(setAccess(accessMultipleNoEndDateInput), getAccess, expectedAccess);
  });

  it('removing access', async () => {
    await setGetTest(setAccess(emptyNoEndDateAccess), getAccess, []);
  });

  it('setting access for unkown', async () => {
    await expect(setAccess(accessSingleNoEndDateInput, 'unknown')).rejects.toThrowError();
  });

  it('setting access with invalid feature', async () => {
    await expect(setAccess(accessWithUnkownFeatureNoEndDate)).rejects.toThrowError();
  });

  it('setting access with invalid door', async () => {
    await expect(setAccess(accessWithUnkownDoorNoEndDate)).rejects.toThrowError();
  });

  it('getting access for unkown', async () => {
    expect(await getAccess('unknown')).toEqual([]);
  });
});

describe('setting/getting access for post', () => {
  beforeAll(async () => {
    await accessApi.clearAccessForUser(username0);
    await postApi.addUsersToPost([username0], postId0);
  });

  afterAll(async () => {
    await postApi.clearHistoryForUser(username0);
  });

  const setAccess =
    (input: AccessEndDateInput, postId = postId0, grantor = username0) =>
    () =>
      accessApi.setPostAccess(postId, input, grantor);
  const getAccess = (postId = postId0) => accessApi.getPostAccess(postId);

  it('setting single access', async () => {
    const expectedAccess = mapPostAccess(expectedAccessSingleInput);

    await setGetTest(setAccess(accessSingleInput), getAccess, expectedAccess);
  });

  it('changing access', async () => {
    const expectedAccess = mapPostAccess(expectedAccessOtherSingleInput);

    await setGetTest(setAccess(otherAccessSingleInput), getAccess, expectedAccess);
  });

  it('setting access with multiple features', async () => {
    const expectedAccess = mapPostAccess(expectedAccessMultipleInput);

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
    await postApi.clearHistoryForPost(postId0);

    await postApi.addUsersToPost([username0], postId0);
  });

  const getAccess = (username = username0) => accessApi.getUserFullAccess(username);

  it('getting combined access for user', async () => {
    const setAccessFunc = async () => {
      const a1 = accessApi.setIndividualAccess(username0, accessSingleInput, username1);
      const a2 = accessApi.setPostAccess(postId0, otherAccessSingleInput, username0);

      const [r1, r2] = await Promise.all([a1, a2]);

      return r1 && r2;
    };

    const expectedAccess1 = mapUserAccess(expectedAccessSingleInput);
    const expectedAccess2 = mapPostAccess(expectedAccessOtherSingleInput);

    const expectedAccess = [...expectedAccess1, ...expectedAccess2].sort(
      (a, b) => a.resource?.localeCompare(b.resource ?? '') ?? 0,
    );

    await setGetTest(setAccessFunc, getAccess, expectedAccess);
  });

  it('getting combined access for unkown', async () => {
    expect(await accessApi.getUserFullAccess('unknown')).toEqual([]);
  });
});

const accessTestSequence: AccessEndDateInput[] = [
  {
    doorEndDates: [],
    featureEndDates:[],
  },
  {
    doorEndDates: [],
    featureEndDates:[],
  },
  {
    doorEndDates: [{ resource:Door.Bd, endDate:null}],
    featureEndDates:[{ resource:Feature.AccessAdmin, endDate:null}],
  },
  {
    doorEndDates: [],
    featureEndDates:[],
  },
];

// Potential problem, this is very implementation specific: It assumes that doors are handled before features and logged as such.
type IndividualAccessLogSimpel<T extends AccessLogIndividualAccess | AccessLogPost> = Omit<
  T,
  'grantor' | 'target' | 'timestamp'
> & { grantor: string; target: string };
const expectedIndividualAccessLogs: IndividualAccessLogSimpel<AccessLogIndividualAccess>[] = [
  {
    grantor: username0,
    isActive: true,
    resource: 'bd',
    resourceType: AccessResourceType.Door,
    endDate: null,
    target: username1,
  },
  {
    grantor: username0,
    isActive: true,
    resource: 'access_admin',
    resourceType: AccessResourceType.Feature,
    endDate: null,
    target: username1,
  },
  {
    grantor: username0,
    isActive: false,
    resource: 'bd',
    resourceType: AccessResourceType.Door,
    endDate: null,
    target: username1,
  },
  {
    grantor: username0,
    isActive: false,
    resource: 'access_admin',
    resourceType: AccessResourceType.Feature,
    endDate: null,
    target: username1,
  },
];

function mapAccessLog(
  accessLog: PrismaIndividualAccessLog,
): IndividualAccessLogSimpel<AccessLogIndividualAccess> {
  const { id, refGrantor, refTarget, timestamp, resourceType, ...reduced } = accessLog;
  return {
    ...reduced,
    grantor: refGrantor,
    target: refTarget,
    resourceType: resourceType as AccessResourceType,
  };
}

describe('setting access for user and checking logs', () => {
  const setAccess = async (inputSequence: AccessEndDateInput[], username = username1) => {
    for (const input of inputSequence) {
      await accessApi.setIndividualAccess(username, input, username0);
    }
  };

  const getAccess = () =>
    accessApi.getAllIndividualAccessLogs().then((logs) => logs.map(mapAccessLog));

  beforeEach(async () => {
    await Promise.all([
      accessApi.clearIndividualAccessLog(),
      accessApi.clearAccessForUser(username1),
    ]);
  });

  it('add and remove access', async () => {
    await setAccess(accessTestSequence);
    expect(await getAccess()).toEqual(expectedIndividualAccessLogs);
  });
});
