import config from '@/config';
import { DatabaseUser } from '@db/user';
import { Access, User } from '@generated/graphql';

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

  const u = {
    ...reduced,
    photoUrl,
    access,
    posts: [],
    userPostHistory: [],
    wikiEdits: 0,
  };
  return u;
}
