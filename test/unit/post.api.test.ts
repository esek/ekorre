import { Post, NewPost, ModifyPost, Utskott, PostType, Access } from '../../src/graphql.generated';
import { DatabasePost } from '../../src/models/db/post';
import { PostAPI } from '../../src/api/post.api';
import { POSTS_HISTORY_TABLE, POSTS_TABLE } from '../../src/api/constants';
import { postReduce } from '../../src/reducers/post.reducer';
import knex from '../../src/api/knex';

const api = new PostAPI();

const uname = 'kk6969mm-s';
const period = 5;

const np: NewPost = {
  name: 'Underphøs',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  interviewRequired: false,
};

const a: Access = {
  web: [],
  doors: [],
};

// Hanterar att SQLite sparar booleans som 1 (true) och 0 (false)
const p: Omit<Post, 'active' | 'interviewRequired'> = {
  postname: 'Underphøs',
  utskott: Utskott.Nollu,
  postType: PostType.U,
  spots: 1,
  description: 'Är helt underbar',
  access: a,
  history: [],
};

const mp: ModifyPost = {
  name: 'Underphøs',
};

const removePost = async (postname: string) => {
  await knex(POSTS_TABLE).delete().where({postname});
};

const removePostHistory = async (username: string) => {
  await knex(POSTS_HISTORY_TABLE).delete().where({refuser: uname});
};

const clearDb = () => {
  removePost('Underphøs');
  removePostHistory(uname);
};

beforeEach(clearDb);

afterAll(clearDb);

test('Test getting all posts', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  const allPosts = await api.getPosts();
  expect(allPosts.length).toBeGreaterThan(0);
});

test('Test getting all posts from utskott', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  const allPosts = await api.getPostsFromUtskott(np.utskott);
  expect(allPosts.length).toBeGreaterThan(0);
});

test('Test getting history entries for user', async () => {
  // Vi skapar först en post och lägger till en user på den
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  const dph = await api.getHistoryEntries(np.name);
  expect(dph.length).toBe(1);

  // Tar bort start och slutdatum
  const { start, end, ...reducedDph } = dph[0];
  expect(reducedDph).toStrictEqual({
    refpost: np.name,
    refuser: uname,
    period,
  });
});

test('Test adding post', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  const res = await api.getPost(np.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual(p);
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test adding post with ea type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: 20, // Borde bli -1 (obegränsat) av API:n
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await  api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({...p, postType: PostType.Ea, spots: -1});
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test adding post with ea type and undefined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: undefined, // Borde bli -1 (obegränsat) av API:n
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await  api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({...p, postType: PostType.Ea, spots: -1});
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test adding post with n type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.N,
    spots: 20,
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await  api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({...p, postType: PostType.N, spots: 20});
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test adding post with n type and undefined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.N,
    spots: undefined,
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(false);

  // Kolla att den faktiskt inte lades till i databasen också
  const res = await  api.getPost(localNp.name);
  expect(res).toBeNull();

});

test('Test adding user to post', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  const res = (await api.getPostsForUser(uname))[0];
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual(p);
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test adding user to post twice in the same period at the same time', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname, uname], np.name, period);
  expect(ok).toBe(true);
});

test('Test adding user to post twice in the same period at different times', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(false);
});

test('Test deleting user from post', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  // Nu borde uname ha en post
  let res = await api.getPostsForUser(uname);
  expect(res.length).not.toBe(0);
  
  const removed = await api.removeUsersFromPost([uname], np.name);
  expect(removed).toBe(true);

  res = await api.getPostsForUser(uname);
  expect(res.length).toBe(0);
});

test('Test modifying post in allowed way', async () => {
  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
    postType: PostType.ExactN,
    spots: 2,
    interviewRequired: true,
  };

  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.modifyPost(localMp);
  expect(ok).toBe(true);

  const res = await api.getPost(np.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({
      ...p,
      utskott: Utskott.Styrelsen,
      postType: PostType.ExactN,
      spots: 2,
    });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeTruthy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('Test increasing spots with postType set to u', async () => {
  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
    spots: 2,
    interviewRequired: true,
  };

  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.modifyPost(localMp);
  expect(ok).toBe(false);

  const res = await api.getPost(np.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual(p);
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});