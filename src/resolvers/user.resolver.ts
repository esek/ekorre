import AccessAPI from '../api/access.api';
import { PostAPI } from '../api/post.api';
import { UserAPI, DatabaseUser } from '../api/user.api';
import auth from '../auth';
import type { Resolvers, User, Access } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('user', ['access']);

const api = new UserAPI();
const accessApi = new AccessAPI();
const postApi = new PostAPI();

async function userReduce(user: DatabaseUser): Promise<User> {
  const indAccess = await accessApi.getIndividualAccess(user.username);
  const posts = await postApi.getPostsForUser(user.username);
  const postNames = posts.map(e => e.postname);
  const postAccess = await accessApi.getAccessForPosts(postNames);

  const access: Access = {
    web: [...indAccess.web, ...postAccess.web],
    doors: [...indAccess.doors, ...postAccess.doors],
  };

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salt, passwordhash, ...reduced } = user;
  const u = { ...reduced, access, posts };
  return u;
}

// Function overloading
/**
 * Apply roles array and strip sensitive information from user.
 * @param u the user or users
 */
async function userReducer(u: DatabaseUser): Promise<User>;
async function userReducer(u: DatabaseUser[]): Promise<User[]>;
async function userReducer(u: DatabaseUser | DatabaseUser[]): Promise<User | User[]> {
  if (u instanceof Array) {
    const a = await Promise.all(u.map((e) => userReduce(e)));
    return a;
  }
  return userReduce(u);
}

const a: Resolvers = {
  Query: {
    users: async (_, { postname }) => {
      if (postname != null) return userReducer(await api.getUsersByPost(postname));
      return userReducer(await api.getAllUsers());
    },
    user: async (_, { username }, ctx) => {
      ctx.getUser();
      const u = await api.getSingleUser(username);
      if (u != null) return userReducer(u);
      return null;
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: async (_, { username, password }) => {
      const partialUser = await api.loginUser(username, password);
      if (partialUser == null) return null;
      const user = await userReducer(partialUser);
      const token = auth.issueToken(user);
      return token;
    },
    createUser: (_, { input }) => api.createUser(input),
  },
};

export default a;
