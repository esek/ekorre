import { Access, User } from '../graphql.generated';
import { DatabaseUser } from '../models/db/user';

export function userReduce(user: DatabaseUser): User {
  // Provide a stub for access to be resolved later.
  const access: Access = {
    web: [],
    doors: [],
  };

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordSalt, passwordHash, ...reduced } = user;
  const u = { ...reduced, access, posts: [] };
  return u;
}
