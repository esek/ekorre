import { User } from '.prisma/client';
import config from '@/config';
import { Access, User as GqlUser } from '@generated/graphql';

export function userReduce(user: User): GqlUser {
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
