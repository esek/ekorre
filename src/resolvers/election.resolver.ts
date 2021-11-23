import { ElectionAPI } from '../api/election.api';
import { useDataLoader } from '../dataloaders';
import type { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { proposalReduce } from '../reducers/proposal.reducer';

const api = new ElectionAPI();

// TODO: SÄKRA SKITEN UR DETTA

const electionResolver: Resolvers = {
  Election: {
    creator: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.creator.username,
    })),
    electables: ({ electables }, _, ctx) => {
      return Promise.all(
        electables.map(async (e) => {
          return ctx.postDataLoader.load(e.postname);
      }));
    },
  }
};