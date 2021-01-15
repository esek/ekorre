import { DatabaseUser } from '../api/user.api';
import { Access, User } from '../graphql.generated';

export function userReduce(user: DatabaseUser): User {
  // Provide a stub for access to be resolved later.
  const access: Access = {
    web: [],
    doors: [],
  };

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salt, passwordhash, ...reduced } = user;
  const u = { ...reduced, access, posts: [] };
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