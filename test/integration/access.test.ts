import { ApolloServer } from 'apollo-server-express';

import {
  ACCESS_RESOURCES_TABLE,
  POSTS_HISTORY_TABLE,
  POSTS_TABLE,
  USER_TABLE,
} from '../../src/api/constants';
import db from '../../src/api/knex';
import {
  AccessResource,
  AccessResourceType,
  NewPost,
  NewUser,
  PostType,
  Utskott,
} from '../../src/graphql.generated';
import apolloServerConfig from '../../src/serverconfig';

const apolloServer = new ApolloServer(apolloServerConfig);

const USER_WITH_ACCESS_AND_RESOURCES_QUERY = `
	query ($username: String!) {
		user(username: $username) {
			firstName
			lastName
			username
		accessResources {
			name
			description
			slug
			resourceType
		}
	}
`;

const CREATE_USER_MUTATION = `
  mutation ($input: NewUser!) {
    createUser(input: $input)
  }
`;

const ADD_POST_MUTATION = `
  mutation ($info: NewPost!) {
    addPost(info: $info)
  }
`;

const ADD_USER_TO_POST = `
  mutation ($usernames: [String!]!, $postname: String!) {
    addUsersToPost(usernames: $usernames, postname: $postname)
  }
`;

const ADD_ACCESS_RESOURCE_MUTATION = `
  mutation (
    $name: String!
    $description: String!
    $resourceType: AccessResourceType!
    $slug: String!
  ) {
    addAccessResource(
      name: $name
      description: $description
      resourceType: $resourceType
      slug: $slug
    )
  }
`;

const SET_USER_ACCESS_MUTATION = `
	mutation ($username: String!, $access: [String!]!) {
		setIndividualAccess(username: $username, access: $access)
	}
`;

const SET_POST_ACCESS_MUTATION = `
	mutation ($postname: String!, $access: [String!]!) {
		setPostAccess(postname: $postname, access: $access)
	}
`;

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

const mockAccessResource0: AccessResource = {
  name: 'Katakomberna',
  slug: 'dungeons',
  description: 'Asbest + Sex cave == Kul för hela Sektionen...?',
  resourceType: AccessResourceType.Door,
};

const mockAccessResource1: AccessResource = {
  name: 'Dungeon Master',
  slug: 'sexmastare',
  description: 'Har hand om katakombernas webbsida, xxx.esek.se (TBA)',
  resourceType: AccessResourceType.Web,
};

const clearDb = async () => {
  await db(POSTS_HISTORY_TABLE).delete().where('refuser', mockNewUser.username);
  await db(POSTS_TABLE).delete().where('postname', mockPost.name);
  await db(USER_TABLE).delete().where('username', mockNewUser.username);
  await db(ACCESS_RESOURCES_TABLE)
    .delete()
    .where('slug', [mockAccessResource0.slug, mockAccessResource1.slug]);
};

beforeAll(async () => {
  await clearDb();
});

afterAll(async () => {
  await clearDb();
});

test('setting and getting full access of user', async () => {
  const createUserRes = await apolloServer.executeOperation({
    query: CREATE_USER_MUTATION,
    variables: {
      input: mockNewUser,
    },
  });

  expect(createUserRes.errors).toBeUndefined();
  expect(createUserRes?.data?.createUser).toBeTruthy();

  const addPostRes = await apolloServer.executeOperation({
    query: ADD_POST_MUTATION,
    variables: {
      info: mockPost,
    },
  });

  expect(addPostRes.errors).toBeUndefined();
  expect(addPostRes?.data?.addPost).toBeTruthy();

  // Add user to new post
  const addUsersToPostRes = await apolloServer.executeOperation({
    query: ADD_USER_TO_POST,
    variables: {
      usernames: [mockNewUser.username],
      postname: mockPost.name,
    }
  });

  expect(addUsersToPostRes.errors).toBeUndefined();
  expect(addUsersToPostRes?.data?.addUsersToPost).toBeTruthy();

  // We can do these two at the 'same' time
  const [addAccessResourceRes0, addAccessResourceRes1] = await Promise.all([
    apolloServer.executeOperation({
      query: ADD_ACCESS_RESOURCE_MUTATION,
      variables: {
        ...mockAccessResource0,
      },
    }),
    apolloServer.executeOperation({
      query: ADD_ACCESS_RESOURCE_MUTATION,
      variables: {
        ...mockAccessResource1,
      },
    }),
  ]);

  expect(addAccessResourceRes0.errors).toBeUndefined();
  expect(addAccessResourceRes0?.data?.addAccessResource).toBeTruthy();
  expect(addAccessResourceRes1.errors).toBeUndefined();
  expect(addAccessResourceRes1?.data?.addAccessResource).toBeTruthy();
});
