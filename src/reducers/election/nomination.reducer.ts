import type { NominationResponse } from '@/models/mappers';
import type { PrismaNomination } from '@prisma/client';

export function nominationReduce(dbNomination: PrismaNomination): NominationResponse {
  const { refUser, refPost, ...reduced } = dbNomination;

  const nr = {
    ...reduced,
    user: {
      username: refUser,
    },
    post: {
      postname: refPost,
    },
  };

  return nr;
}
