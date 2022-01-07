import config from '../config';
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
  const photoUrl = user.photoUrl ? `${config.FILES.ENDPOINT}${user.photoUrl}` : null;

  // If isFuncUser is undefined, assume false
  const isFuncUser = user.isFuncUser ?? false;

  const u = {
    ...reduced,
    photoUrl,
    isFuncUser,
    access,
    posts: [],
    userPostHistory: [],
    wikiEdits: 0,
  };
  return u;
}
