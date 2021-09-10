import { Post, NewPost, ModifyPost, Utskott, PostType, Access } from '../../src/graphql.generated';
import { DatabasePost } from '../../src/models/db/post';
import { PostAPI } from '../../src/api/post.api';
import { POSTS_TABLE } from '../../src/api/constants';
import { postReduce } from '../../src/reducers/post.reducer';
import knex from '../../src/api/knex';

const api = new PostAPI();

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

const clearDb = () => {
  removePost('Underphøs');
};

beforeEach(clearDb);

afterAll(clearDb);

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