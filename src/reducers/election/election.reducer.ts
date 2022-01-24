import type { ElectionResponse } from '@/models/mappers';
import type { DatabaseElection } from '@db/election';

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
