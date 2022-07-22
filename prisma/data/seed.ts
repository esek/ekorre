import { PrismaClient } from '@prisma/client';

import { apiKeyAccess, apiKeys, individualAccess, postAccess } from './access.seed';
import { posts } from './post.seed';
import { users } from './user.seed';

const prisma = new PrismaClient();

const run = async () => {
  await Promise.all([
    prisma.prismaUser.createMany({ data: users, skipDuplicates: true }),
    prisma.prismaPost.createMany({ data: posts, skipDuplicates: true }),
  ]);

  await prisma.prismaApiKey.createMany({ data: apiKeys, skipDuplicates: true });

  await Promise.all([
    prisma.prismaIndividualAccess.createMany({ data: individualAccess, skipDuplicates: true }),
    prisma.prismaPostAccess.createMany({ data: postAccess, skipDuplicates: true }),
    prisma.prismaApiKeyAccess.createMany({ data: apiKeyAccess, skipDuplicates: true }),
  ]);
};

run()
  .then(() => {
    console.log('Seeding done');
  })
  .catch((err) => {
    console.error('Error seeding database', err);
  });
