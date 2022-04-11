import { PostAPI } from '@/api/post.api';
import prisma from '@/api/prisma';
import { UserAPI } from '@/api/user.api';
import { BadRequestError } from '@/errors/request.errors';
import { postReduce } from '@/reducers/post.reducer';
import { midnightTimestamp } from '@/util';
import { Access, ModifyPost, NewPost, NewUser, Post, PostType, Utskott } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';

const api = new PostAPI();
const userApi = new UserAPI();

// P.g.a. FOREIGN KEY constraint
const DUMMY_USER: NewUser = {
  username: 'testPostApiTestUser',
  firstName: 'Adde',
  lastName: 'Heinrichson',
  class: 'E18',
  password: 'hunter2',
};

const np: NewPost = {
  name: 'Underphøs',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  interviewRequired: false,
};

// ID given by `createPost`
const p: Omit<PrismaPost, 'id'> = {
  postname: 'Underphøs',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  active: true,
  interviewRequired: false,
};

const mp: Omit<ModifyPost, 'id'> = {
  postname: 'Underphøs',
};

const removePost = async (postname: string) => {
  await prisma.prismaPost.deleteMany({
    where: {
      postname, // We can use postname, ID is not needed
    },
  });
};

const removePostHistory = async (username: string) => {
  await prisma.prismaPostHistory.deleteMany({
    where: {
      refUser: username,
    },
  });
};

const clearDb = async () => {
  await removePostHistory(DUMMY_USER.username);
  await removePost('Underphøs');
};

beforeAll(async () => {
  await userApi.createUser(DUMMY_USER);
});

beforeEach(clearDb);

afterEach(clearDb);

afterAll(async () => {
  clearDb();
  await prisma.prismaUser.delete({
    where: {
      username: DUMMY_USER.username,
    },
  });
});

test('getting all posts', async () => {
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const allPosts = await api.getPosts();
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting all posts from utskott', async () => {
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const allPosts = await api.getPostsFromUtskott(np.utskott);
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting history entries for user', async () => {
  // Vi skapar först en post och lägger till en user på den
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const ok = await api.addUsersToPost([DUMMY_USER.username], postId);
  expect(ok).toBe(true);

  const dph = await api.getHistoryEntries({ refUser: DUMMY_USER.username });
  expect(dph.length).toBe(1);

  // Tar bort start och slutdatum
  const { id, start, end, ...reducedDph } = dph[0];
  expect(reducedDph).toStrictEqual({
    refPost: postId,
    refUser: DUMMY_USER.username,
  });
});

test('adding post', async () => {
  const postId = await api.createPost(np);
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
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  await expect(api.createPost(np)).rejects.toThrowError('Denna posten finns redan');
});

test('adding post with ea type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: 20, // Borde bli -1 (obegränsat) av API:n
  };

  const postId = await api.createPost(localNp);
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

  const postId = await api.createPost(localNp);
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

  const postId = await api.createPost(localNp);
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

  const postId = await api.createPost(localNp);
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
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const ok = await api.addUsersToPost([DUMMY_USER.username], postId);
  expect(ok).toBe(true);

  const res = (await api.getPostsForUser(DUMMY_USER.username))[0];
  if (res != null) {
    const { id, ...reducedRes } = res;
    expect(id).toEqual(expect.any(Number));
    expect(reducedRes).toStrictEqual(p);
  } else {
    expect(res).not.toBeNull();
  }
});

test('deleting user from post', async () => {
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const start = new Date();

  const ok = await api.addUsersToPost([DUMMY_USER.username], postId, start);
  expect(ok).toBe(true);

  // Nu borde DUMMY_USER.username ha en post
  const res = await api.getHistoryEntries({ refUser: DUMMY_USER.username });
  expect(res.length).not.toBe(0);

  const removed = await api.removeHistoryEntry(res[0].id);
  expect(removed).toBe(true);

  await expect(api.getPostsForUser(DUMMY_USER.username)).resolves.toHaveLength(0);
});

test('modifying post in allowed way', async () => {
  const localMp: Omit<ModifyPost, 'id'> = {
    ...mp,
    utskott: Utskott.Styrelsen,
    postType: PostType.ExactN,
    spots: 2,
    interviewRequired: true,
  };

  const postId = await api.createPost(np);
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
  const postId = await api.createPost(np);
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
  const postId = await api.createPost(np);
  expect(postId).toEqual(expect.any(Number));

  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
    spots: 2,
    interviewRequired: true,
    id: postId,
  };

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
  const postId = await api.createPost(np);
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
  const postId = await api.createPost(np);
  await api.addUsersToPost([DUMMY_USER.username], postId);

  // Vår dummy-db innehåller några också
  expect(await api.getNumberOfVolunteers()).toBeGreaterThanOrEqual(1);
});

test('get number of volunteers in year 1700', async () => {
  const start = new Date('1700-03-13');
  const end = new Date('1700-12-31');
  expect(await api.getNumberOfVolunteers(start)).toBe(0);
  const postId = await api.createPost(np);
  await api.addUsersToPost([DUMMY_USER.username], postId, start, end);

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
  const postId = await api.createPost(np);
  await api.addUsersToPost([DUMMY_USER.username], postId, start);

  {
    // Som default ska `end` bli null
    const { id, ...reduced } = (await api.getHistoryEntries({ refUser: DUMMY_USER.username }))[0];
    expect(reduced).toEqual({
      refUser: DUMMY_USER.username,
      refPost: postId,
      start: new Date(midnightTimestamp(start, 'after')),
      end: null,
    });

    // Nu kollar vi om vi kan lägga till ett slutdatum
    await expect(api.setUserPostEnd(id, end)).resolves.toBeTruthy();
  }

  const { id, ...reduced } = (await api.getHistoryEntries({ refUser: DUMMY_USER.username }))[0];
  expect(reduced).toEqual({
    refUser: DUMMY_USER.username,
    refPost: postId,
    start: new Date(midnightTimestamp(start, 'after')),
    end: new Date(midnightTimestamp(end, 'before')),
  });
});
