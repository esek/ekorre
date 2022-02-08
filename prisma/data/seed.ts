import { PrismaClient } from '@prisma/client';

import { users } from './user.seed';

const prisma = new PrismaClient();

const run = async () => {
  await Promise.all(
    users.map(async (user) => {
      await prisma.user
        .create({
          data: {
            ...user,
          },
        })
        .catch(() => {
          // Ignore duplicate users
          return null;
        });
    }),
  );
};

run()
  .then(() => {
    console.log('Seeding done');
  })
  .catch((err) => {
    console.error('Error seeding database', err);
  });
