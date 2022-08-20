import { PostAPI } from '@/api/post.api';
import prisma from '@/api/prisma';
import config from '@/config';
import { BadRequestError } from '@/errors/request.errors';
import { midnightTimestamp } from '@/util';
import { ModifyPost, NewPost, NewUser, PostType, Utskott } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';
import { genRandomUser, getRandomPostname } from '@test/utils/utils';

const api = new PostAPI();

// P.g.a. FOREIGN KEY constraint
let dummyUser: NewUser;
let removeDummyUser: () => Promise<void>;

const originalAccessCooldown = config.POST_ACCESS_COOLDOWN_DAYS;

const np: NewPost = {
  name: getRandomPostname(),
  email: 'spamme@example.com',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  interviewRequired: false,
};

// ID given by `createPost`
const p: Omit<PrismaPost, 'id'> = {
  postname: np.name,
  email: 'spamme@example.com',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  active: true,
  interviewRequired: false,
  priority: 0,
};

const mp: Omit<ModifyPost, 'id'> = {
  postname: np.name,
};

beforeEach(async () => {
  jest.useRealTimers();
  config.POST_ACCESS_COOLDOWN_DAYS = originalAccessCooldown;
  const [createUser, removeUser] = genRandomUser([]);
  const prismaUser = await createUser();
  removeDummyUser = removeUser;

  dummyUser = {
    username: prismaUser.username,
    class: prismaUser.class,
    email: prismaUser.email,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    password: 'randomstringdontreallymatter',
  };
});

afterEach(async () => {
  jest.useRealTimers();
  config.POST_ACCESS_COOLDOWN_DAYS = originalAccessCooldown;
  await api.clearHistoryForUser(dummyUser.username);
  await prisma.prismaPost.deleteMany({
    where: {
      postname: np.name,
    },
  });
  await removeDummyUser();
});

test('getting all posts', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const allPosts = await api.getPosts();
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting all posts from utskott', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const allPosts = await api.getPostsFromUtskott(np.utskott);
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting history entries for user', async () => {
  // Vi skapar först en post och lägger till en user på den
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const ok = await api.addUsersToPost([dummyUser.username], postId);
  expect(ok).toBe(true);

  const dph = await api.getHistoryEntries(dummyUser.username);
  expect(dph.length).toBe(1);

  // Tar bort start och slutdatum
  const { id, start, end, ...reducedDph } = dph[0];
  expect(reducedDph).toStrictEqual({
    refPost: postId,
    refUser: dummyUser.username,
  });
});

test('adding post', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual(p);
  } else {
    expect(res).not.toBeNull();
  }
});

test('adding duplicate post', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  await expect(api.createPost(np)).rejects.toThrowError('Denna posten finns redan');
});

test('adding post with ea type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: 20, // Borde bli -1 (obegränsat) av API:n
  };

  const { id: postId } = await api.createPost(localNp);
  expect(postId).toEqual(expect.any(Number));

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
  } else {
    expect(res).not.toBeNull();
  }
});

test('adding post with ea type and undefined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: undefined, // Borde bli -1 (obegränsat) av API:n
  };

  const { id: postId } = await api.createPost(localNp);
  expect(postId).toEqual(expect.any(Number));

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
  } else {
    expect(res).not.toBeNull();
  }
});

test('adding post with n type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.N,
    spots: 20,
  };

  const { id: postId } = await api.createPost(localNp);
  expect(postId).toEqual(expect.any(Number));

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.N, spots: 20 });
  } else {
    expect(res).not.toBeNull();
  }
});

test('adding post with n type and negative number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.N,
    spots: -1,
  };

  await expect(api.createPost(localNp)).rejects.toThrowError(BadRequestError);
});

test('adding post with n type, defined number, and undefined description and intReq', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.ExactN,
    spots: 20,
    description: undefined, // Borde defaulta till 'Postbeskrivning saknas :/'
    interviewRequired: undefined, // Borde defaulta till false
  };

  const { id: postId } = await api.createPost(localNp);
  expect(postId).toEqual(expect.any(Number));

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({
      ...p,
      postType: PostType.ExactN,
      spots: 20,
      description: 'Postbeskrivning saknas :/',
    });
  } else {
    expect(res).not.toBeNull();
  }
});

test('adding post with n type and undefined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.N,
    spots: undefined,
  };

  await expect(api.createPost(localNp)).rejects.toThrowError(BadRequestError);
});

test('adding user to post', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const ok = await api.addUsersToPost([dummyUser.username], postId);
  expect(ok).toBe(true);

  const res = (await api.getPostsForUser(dummyUser.username))[0];
  if (res != null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual(p);
  } else {
    expect(res).not.toBeNull();
  }
});

test('deleting user from post', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const start = new Date();

  const ok = await api.addUsersToPost([dummyUser.username], postId, start);
  expect(ok).toBe(true);

  // Nu borde DUMMY_USER.username ha en post
  const res = await api.getHistoryEntries(dummyUser.username);
  expect(res.length).not.toBe(0);

  const removed = await api.removeHistoryEntry(res[0].id);
  expect(removed).toBe(true);

  await expect(api.getPostsForUser(dummyUser.username)).resolves.toHaveLength(0);
});

test('modifying post in allowed way', async () => {
  const localMp: Omit<ModifyPost, 'id'> = {
    ...mp,
    utskott: Utskott.Styrelsen,
    postType: PostType.ExactN,
    spots: 2,
    interviewRequired: true,
  };

  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const ok = await api.modifyPost({ id: postId, ...localMp });
  expect(ok).toBe(true);

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({
      ...p,
      utskott: Utskott.Styrelsen,
      postType: PostType.ExactN,
      spots: 2,
      interviewRequired: true,
    });
  } else {
    expect(res).not.toBeNull();
  }
});

test('modyfing post without touching neither PostType nor spots', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
    id: postId,
  };

  const ok = await api.modifyPost(localMp);
  expect(ok).toBe(true);

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual({
      ...p,
      utskott: Utskott.Styrelsen,
    });
  } else {
    expect(res).not.toBeNull();
  }
});

test('increasing spots with postType set to u', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));
  // API should silently fix spots to 2

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual(p);
  } else {
    expect(res).not.toBeNull();
  }
});

test('changing postType to e.a. from u without changing spots', async () => {
  const { id: postId } = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const localMp: ModifyPost = {
    ...mp,
    postType: PostType.Ea,
    id: postId,
  };

  const ok = await api.modifyPost(localMp);
  expect(ok).toBe(true);

  const res = await api.getPost(postId);
  if (res !== null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    // Borde ändra request till default, dvs. spots: -1
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
  } else {
    expect(res).not.toBeNull();
  }
});

test('get current number of volunteers', async () => {
  const { id: postId } = await api.createPost(np);
  await api.addUsersToPost([dummyUser.username], postId);

  // Vår dummy-db innehåller några också
  expect(await api.getNumberOfVolunteers()).toBeGreaterThanOrEqual(1);
});

test('get number of volunteers in year 1700', async () => {
  const start = new Date('1700-03-13');
  const end = new Date('1700-12-31');
  expect(await api.getNumberOfVolunteers(start)).toBe(0);
  const { id: postId } = await api.createPost(np);
  await api.addUsersToPost([dummyUser.username], postId, start, end);

  // Number of volunteers
  const oldVolunteers = await api.getNumberOfVolunteers(start);
  expect(oldVolunteers).toBe(1);
  expect(await api.getNumberOfVolunteers(new Date('2100-01-01'))).toBeLessThanOrEqual(
    oldVolunteers,
  );
});

test('set end time of history entry', async () => {
  const start = new Date('1666-03-13');
  const end = new Date('1666-12-31');
  const { id: postId } = await api.createPost(np);
  await api.addUsersToPost([dummyUser.username], postId, start);

  {
    // Som default ska `end` bli null
    const { id, ...reduced } = (await api.getHistoryEntries(dummyUser.username))[0];
    expect(reduced).toEqual({
      refUser: dummyUser.username,
      refPost: postId,
      start: new Date(midnightTimestamp(start, 'after')),
      end: null,
    });

    // Nu kollar vi om vi kan lägga till ett slutdatum
    await expect(api.setUserPostEnd(id, end)).resolves.toBeTruthy();
  }

  const { id, ...reduced } = (await api.getHistoryEntries(dummyUser.username))[0];
  expect(reduced).toEqual({
    refUser: dummyUser.username,
    refPost: postId,
    start: new Date(midnightTimestamp(start, 'after')),
    end: new Date(midnightTimestamp(end, 'before')),
  });
});

test('get history entry that is not over but define access cooldown', async () => {
  config.POST_ACCESS_COOLDOWN_DAYS = 30;
  const start = new Date();
  const end = new Date();
  const { id: postId } = await api.createPost(np);

  await api.addUsersToPost([dummyUser.username], postId, start, end);
  await expect(api.getHistoryEntries(undefined, postId, false, true)).resolves.toHaveLength(1);
});

test('get history entry that is over, but access cooldown has not ended', async () => {
  config.POST_ACCESS_COOLDOWN_DAYS = 30;
  const start = new Date();
  const end = new Date();
  const { id: postId } = await api.createPost(np);
  await api.addUsersToPost([dummyUser.username], postId, start, end);

  // Move time forward, but keep it within interval
  const msInADay = 86400000;
  const trueTime = new Date();
  jest
    .useFakeTimers()
    .setSystemTime(
      new Date(trueTime.getTime() + (config.POST_ACCESS_COOLDOWN_DAYS * msInADay) / 2),
    );
  await expect(api.getHistoryEntries(undefined, postId, false, true)).resolves.toHaveLength(1);
});

test('get history entry that is over, where access cooldown has ended', async () => {
  config.POST_ACCESS_COOLDOWN_DAYS = 30;
  const start = new Date();
  const end = new Date();
  const { id: postId } = await api.createPost(np);
  await api.addUsersToPost([dummyUser.username], postId, start, end);

  const msInADay = 86400000;
  const trueTime = new Date();

  // Move time forward out of interval
  jest
    .useFakeTimers()
    .setSystemTime(
      new Date(trueTime.getTime() + config.POST_ACCESS_COOLDOWN_DAYS * msInADay + msInADay * 5),
    );
  await expect(api.getHistoryEntries(undefined, postId, false, true)).resolves.toHaveLength(0);
});

test('attempting to get current history entries that are also within access coldown fails', async () => {
  await expect(api.getHistoryEntries(undefined, undefined, true, true)).rejects.toThrowError(
    BadRequestError,
  );
});
