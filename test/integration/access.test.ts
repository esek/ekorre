import { issueToken } from '@/auth';
import { NOOP } from '@/models/base';
import { PostAPI } from '@api/post';
import { Door, Feature } from '@generated/graphql';
import { PrismaPost, PrismaUser } from '@prisma/client';
import {
  SET_POST_ACCESS_MUTATION,
  SET_USER_ACCESS_MUTATION,
  USER_WITH_ACCESS_QUERY,
} from '@test/utils/queries';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser, genRandomPost } from '@test/utils/utils';

const postApi = new PostAPI();

let editUser: PrismaUser;
let removeEditUser: NOOP;

// Ska vara tillgänglig för alla test
let mockUser: PrismaUser;
let removeMockUser: NOOP;

let mockPost: PrismaPost;
let removeMockPost: NOOP;

beforeAll(async () => {
  const [createEditUser, removeEditUsr] = genRandomUser([Feature.Superadmin]);
  editUser = await createEditUser();
  removeEditUser = removeEditUsr;

  const [create, remove] = genRandomUser();
  mockUser = await create();
  removeMockUser = remove;

  const [createPost, removePost] = genRandomPost();
  mockPost = await createPost();
  removeMockPost = removePost;

  await postApi.addUsersToPost([mockUser.username], mockPost.id);
});

afterAll(async () => {
  await removeMockPost();
  await removeMockUser();
  await removeEditUser();
});

test('setting and getting full access of user', async () => {
  const superadminToken = issueToken(
    {
      username: editUser.username,
    },
    'accessToken',
  );

  // Set individual access and post access
  const [setIndividualAccessRes, setPostAccessRes] = await Promise.all([
    requestWithAuth(
      SET_USER_ACCESS_MUTATION,
      {
        username: mockUser.username,
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
        postId: mockPost.id,
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
      username: mockUser.username,
    },
    superadminToken,
  );

  expect(userWithAccessRes.errors).toBeUndefined();
  expect(userWithAccessRes?.data?.user).toMatchObject({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    username: mockUser.username,
    access: {
      features: [Feature.AccessAdmin, Feature.Superadmin],
      doors: [Door.Bd, Door.Hk],
    },
  });
});
