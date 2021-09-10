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

test('Test adding post', done => {
  api.createPost(np).then(ok => {
    expect(ok).toBe(true);
    api.getPost(np.name).then(res => {
      if (res !== null) {
        const { active, interviewRequired, ...reducedRes } = postReduce(res);
        expect(reducedRes).toStrictEqual(p);
        expect(active).toBe(1);
        expect(interviewRequired).toBe(0);
      } else {
        expect(res).not.toBeNull();
      }
      done();
    });
  });
});