import type { DatabaseNomination } from '../../models/db/election';
import type { NominationResponse } from '../../models/mappers';

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
