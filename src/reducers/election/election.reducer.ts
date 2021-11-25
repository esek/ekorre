import type { Election } from '../../graphql.generated';
import type { ElectionResponse } from '../../models/mappers';

export function electionReduce(dbElection: DatabaseElection): ElectionResponse {
  const { refcreator } = dbElection;

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