import type { DatabaseNomination } from '../../models/db/election';
import type { NominationResponse } from '../../models/mappers';

export function nominationReduce(dbNomination: DatabaseNomination): NominationResponse {
  const { refelection, refuser, refpost } = dbNomination;

  const nr = {
    election: {
      id: refelection,
    },
    user: {
      username: refuser,
    },
    post: {
      postname: refpost,
    },
  };

  return nr;
}
