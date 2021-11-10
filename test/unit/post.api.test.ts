import { POSTS_HISTORY_TABLE, POSTS_TABLE } from '../../src/api/constants';
import knex from '../../src/api/knex';
import { PostAPI } from '../../src/api/post.api';
import { Access, ModifyPost, NewPost, Post, PostType, Utskott } from '../../src/graphql.generated';
import { postReduce } from '../../src/reducers/post.reducer';

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
  await knex(POSTS_TABLE).delete().where({ postname });
};

const removePostHistory = async (username: string) => {
  await knex(POSTS_HISTORY_TABLE).delete().where({ refuser: username });
};

const clearDb = () => {
  removePost('Underphøs');
  removePostHistory(uname);
};

beforeEach(clearDb);

afterAll(clearDb);

test('getting all posts', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  const allPosts = await api.getPosts();
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting all posts from utskott', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  const allPosts = await api.getPostsFromUtskott(np.utskott);
  expect(allPosts.length).toBeGreaterThan(0);
});

test('getting history entries for user', async () => {
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

test('adding post', async () => {
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

test('adding duplicate post', async () => {
  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  await expect(api.createPost(np)).rejects.toThrowError('Denna posten finns redan');
});

test('adding post with ea type and defined number', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.Ea,
    spots: 20, // Borde bli -1 (obegränsat) av API:n
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
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

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
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

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.N, spots: 20 });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
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

  const ok = await api.createPost(localNp);
  expect(ok).toBe(false);

  await expect(api.getPost(localNp.name)).rejects.toThrowError('Posten kunde inte hittas');
});

test('adding post with n type, defined number, and undefined description and intReq', async () => {
  const localNp: NewPost = {
    ...np,
    postType: PostType.ExactN,
    spots: 20,
    description: undefined, // Borde defaulta till 'Postbeskrivning saknas :/'
    interviewRequired: undefined, // Borde defaulta till false
  };

  const ok = await api.createPost(localNp);
  expect(ok).toBe(true);

  const res = await api.getPost(localNp.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    expect(reducedRes).toStrictEqual({
      ...p,
      postType: PostType.ExactN,
      spots: 20,
      description: 'Postbeskrivning saknas :/',
    });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
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

  const ok = await api.createPost(localNp);
  expect(ok).toBe(false);

  // Kolla att den faktiskt inte lades till i databasen också
  await expect(api.getPost(localNp.name)).rejects.toThrowError('Posten kunde inte hittas');
});

test('adding user to post', async () => {
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

test('adding user to post twice in the same period at the same time', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname, uname], np.name, period);
  expect(ok).toBe(true);
});

test('adding user to post twice in the same period at different times', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  await expect(api.addUsersToPost([uname], np.name, period)).rejects.toThrowError(
    'Användaren kunde inte läggas till',
  );
});

test('deleting user from post', async () => {
  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.addUsersToPost([uname], np.name, period);
  expect(ok).toBe(true);

  // Nu borde uname ha en post
  const res = await api.getPostsForUser(uname);
  expect(res.length).not.toBe(0);

  const removed = await api.removeUsersFromPost([uname], np.name);
  expect(removed).toBe(true);

  await expect(api.getPostsForUser(uname)).rejects.toThrowError('Inga poster hittades');
});

test('modifying post in allowed way', async () => {
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

test('modyfing post without touching neither PostType nor spots', async () => {
  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
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
    });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});

test('increasing spots with postType set to u', async () => {
  const localMp: ModifyPost = {
    ...mp,
    utskott: Utskott.Styrelsen,
    spots: 2,
    interviewRequired: true,
  };

  const ok = await api.createPost(np);
  expect(ok).toBe(true);

  await expect(api.modifyPost(localMp)).rejects.toThrowError(
    'Ogiltig kombination av post och antal platser',
  );

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

test('changing postType to e.a. from u without changing spots', async () => {
  const localMp: ModifyPost = {
    ...mp,
    postType: PostType.Ea,
  };

  let ok = await api.createPost(np);
  expect(ok).toBe(true);

  ok = await api.modifyPost(localMp);
  expect(ok).toBe(true);

  const res = await api.getPost(np.name);
  if (res !== null) {
    const { active, interviewRequired, ...reducedRes } = postReduce(res);
    // Borde ändra request till default, dvs. spots: -1
    expect(reducedRes).toStrictEqual({ ...p, postType: PostType.Ea, spots: -1 });
    expect(active).toBeTruthy();
    expect(interviewRequired).toBeFalsy();
  } else {
    expect(res).not.toBeNull();
  }
});
