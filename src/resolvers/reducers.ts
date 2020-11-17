import { AccessAPI } from '../api/access.api';
import { PostAPI, PostModel } from '../api/post.api';
import { DatabaseUser, UserAPI } from '../api/user.api';
import { Access, HistoryEntry, Post, User } from '../graphql.generated';

/**
 * READ first!
 * This is a aggregate module since node does not support circular
 * dependecies. This also so reducer functions can be reused for other
 * resolvers.
 */

const accessApi = new AccessAPI();
const postApi = new PostAPI();
const userApi = new UserAPI();

/**
 * --------------------------------------------------------------------------------
 */

export async function postHistoryReduce(refpost: string) {
  const entries = await postApi.getHistoryEntries(refpost);
  const users = await userApi.getUsersByPost(refpost);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const reducedUsers = await userReducer(users);

  const init: Record<string, User> = {};
  const userMap = reducedUsers.reduce((a, e) => ({ [e.username]: e }), init);

  const history = entries.map<HistoryEntry>((e) => ({
    holder: userMap[e.refuser],
    start: e.start,
    end: e.end,
  }));

  return history;
}

export async function postReduce(post: PostModel): Promise<Post> {
  const access = await accessApi.getPostAccess(post.postname);

  const p: Post = {
    ...post,
    access,
  };

  return p;
}

export async function postReducer(incoming: PostModel): Promise<Post>;
export async function postReducer(incoming: PostModel[]): Promise<Post[]>;
export async function postReducer(incoming: PostModel | PostModel[]): Promise<Post | Post[]> {
  if (incoming instanceof Array) {
    const posts = await Promise.all(incoming.map((e) => postReduce(e)));
    return posts;
  }
  return postReduce(incoming);
}

/**
 * --------------------------------------------------------------------------------
 */

export async function userReduce(user: DatabaseUser): Promise<User> {
  const indAccess = await accessApi.getIndividualAccess(user.username);
  const posts = await postApi.getPostsForUser(user.username);
  const postNames = posts.map((e) => e.postname);
  const postAccess = await accessApi.getAccessForPosts(postNames);

  const access: Access = {
    web: [...indAccess.web, ...postAccess.web],
    doors: [...indAccess.doors, ...postAccess.doors],
  };

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salt, passwordhash, ...reduced } = user;
  const u = { ...reduced, access };
  return u;
}

// Function overloading
/**
 * Apply roles array and strip sensitive information from user.
 * @param u the user or users
 */
export async function userReducer(u: DatabaseUser): Promise<User>;
export async function userReducer(u: DatabaseUser[]): Promise<User[]>;
export async function userReducer(u: DatabaseUser | DatabaseUser[]): Promise<User | User[]> {
  if (u instanceof Array) {
    const a = await Promise.all(u.map((e) => userReduce(e)));
    return a;
  }
  return userReduce(u);
}
