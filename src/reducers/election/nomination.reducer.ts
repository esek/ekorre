import type { NominationResponse } from '@/models/mappers';
import type { DatabaseNomination } from '@db/election';

export function nominationReduce(dbNomination: DatabaseNomination): NominationResponse {
  const { refuser, refpost, ...reduced } = dbNomination;

  const nr = {
    ...reduced,
    user: {
      username: refuser,
    },
    post: {
      postname: refpost,
    },
  };

  return nr;
}
