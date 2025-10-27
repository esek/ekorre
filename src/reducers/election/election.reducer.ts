import type { ElectionResponse } from '@/models/mappers';
import type { PrismaElection } from '@prisma/client';

export function electionReduce(dbElection: PrismaElection): ElectionResponse {
  const { refCreator, ...reduced } = dbElection;

  const e = {
    ...reduced,
    creator: {
      username: refCreator,
    },
    name: reduced.name ?? 'Val #' + reduced.id.toString(),
  };

  return e;
}
