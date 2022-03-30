import {
  IND_ACCESS_TABLE,
  POSTS_HISTORY_TABLE,
  POSTS_TABLE,
  POST_ACCESS_TABLE,
  USER_TABLE,
} from '@/api/constants';
import db from '@/api/knex';
import { issueToken } from '@/auth';
import { Door, Feature, NewPost, NewUser, PostType, Utskott } from '@generated/graphql';
import { ADD_POST_MUTATION, ADD_USER_TO_POST, CREATE_USER_MUTATION, SET_POST_ACCESS_MUTATION, SET_USER_ACCESS_MUTATION, USER_WITH_ACCESS_QUERY } from '@test/utils/queries';
import requestWithAuth from '@test/utils/requestWithAuth';

// Ska vara tillgänglig för alla test
const mockNewUser: NewUser = {
  username: 'accessRegressionTestUser',
  firstName: 'Donald',
  lastName: 'Trumpet',
  class: 'E28',
  password: 'bigdikdolan',
};

const mockPost: NewPost = {
  name: 'accessRegressionTestPost',
  utskott: Utskott.Infu,
  postType: PostType.U,
  spots: 1,
  description: 'Är med i 1 (ett!!!) enda jävla test',
  interviewRequired: false,
};

const addMockUserAndPost = async () => {
  const superadminToken = issueToken({ username: 'aa0000bb-s' }, 'accessToken');

  const createUserRes = await requestWithAuth(
    CREATE_USER_MUTATION,
    { input: mockNewUser },
    superadminToken,
  );

  expect(createUserRes.errors).toBeUndefined();
  expect(createUserRes?.data?.createUser).toBeTruthy();

  const addPostRes = await requestWithAuth(ADD_POST_MUTATION, { info: mockPost }, superadminToken);

  expect(addPostRes.errors).toBeUndefined();
  expect(addPostRes?.data?.addPost).toBeTruthy();

  // Add user to new post
  const addUsersToPostRes = await requestWithAuth(
    ADD_USER_TO_POST,
    { usernames: [mockNewUser.username], postname: mockPost.name },
    superadminToken,
  );

  expect(addUsersToPostRes.errors).toBeUndefined();
  expect(addUsersToPostRes?.data?.addUsersToPost).toBeTruthy();
};

const clearDb = async () => {
  await Promise.all([
    db(IND_ACCESS_TABLE).delete().where('refname', mockNewUser.username),
    db(POST_ACCESS_TABLE).delete().where('refname', mockPost.name),
    db(POSTS_HISTORY_TABLE).delete().where('refuser', mockNewUser.username),
    db(POSTS_TABLE).delete().where('postname', mockPost.name),
    db(USER_TABLE).delete().where('username', mockNewUser.username),
  ]);
};

beforeAll(async () => {
  await clearDb();
});

beforeEach(async () => {
  await addMockUserAndPost();
});

afterAll(async () => {
  await clearDb();
});

test('setting and getting full access of user', async () => {
  const superadminToken = issueToken({ username: 'aa0000bb-s' }, 'accessToken');

  // Set individual access and post access
  const [setIndividualAccessRes, setPostAccessRes] = await Promise.all([
    requestWithAuth(
      SET_USER_ACCESS_MUTATION,
      {
        username: mockNewUser.username,
        access: {
          features: [Feature.AccessAdmin],
          doors: [Door.Bd],
        },
      },
      superadminToken,
    ),
    requestWithAuth(
      SET_POST_ACCESS_MUTATION,
      {
        postname: mockPost.name,
        access: {
          features: [Feature.Superadmin],
          doors: [Door.Hk],
        },
      },
      superadminToken,
    ),
  ]);

  expect(setIndividualAccessRes.errors).toBeUndefined();
  expect(setIndividualAccessRes?.data?.setIndividualAccess).toBeTruthy();
  expect(setPostAccessRes.errors).toBeUndefined();
  expect(setPostAccessRes?.data?.setPostAccess).toBeTruthy();

  // Now we check if we get the correct total access!
  const userWithAccessRes = await requestWithAuth(
    USER_WITH_ACCESS_QUERY,
    {
      username: mockNewUser.username,
    },
    superadminToken,
  );

  expect(userWithAccessRes.errors).toBeUndefined();
  expect(userWithAccessRes?.data?.user).toMatchObject({
    firstName: mockNewUser.firstName,
    lastName: mockNewUser.lastName,
    username: mockNewUser.username,
    access: {
      features: [Feature.AccessAdmin, Feature.Superadmin],
      doors: [Door.Bd, Door.Hk],
    },
  });
});
