import type { DatabaseElection } from '../../models/db/election';
import type { ElectionResponse } from '../../models/mappers';

export function electionReduce(dbElection: DatabaseElection): ElectionResponse {
  const { refcreator, ...reduced } = dbElection;

  const e = {
    ...reduced,
    creator: {
      username: refcreator,
    },
  };

  return e;
}
