import config from '@/config';
import { Access, User } from '@generated/graphql';
import { PrismaUser } from '@prisma/client';

export function userReduce(user: PrismaUser): User {
  // Provide a stub for access to be resolved later.
  const access: Access = {
    features: [],
    doors: [],
  };

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordSalt, passwordHash, dateJoined, ...reduced } = user;
  const photoUrl = user.photoUrl ? `${config.FILES.ENDPOINT}${user.photoUrl}` : null;

  const u: User = {
    ...reduced,
    fullName: '',
    photoUrl,
    access,
    posts: [],
    postHistory: [],
    wikiEdits: 0,
    emergencyContacts: [],
    loginProviders: [],
    verified: false,
  };
  return u;
}
