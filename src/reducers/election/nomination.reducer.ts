import type { NominationResponse } from '@/models/mappers';
import { NominationAnswer } from '@generated/graphql';
import type { PrismaNomination } from '@prisma/client';

export function nominationReduce(dbNomination: PrismaNomination): NominationResponse {
  const { refUser, refPost, answer, ...reduced } = dbNomination;

  const nr = {
    ...reduced,
    user: {
      username: refUser,
    },
    post: {
      id: refPost,
    },
    answer: answer as NominationAnswer, // Prisma enum to graphql enum
  };

  return nr;
}
