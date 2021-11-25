import { ElectionAPI } from '../api/election.api';
import { useDataLoader } from '../dataloaders';
import type { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { proposalReduce } from '../reducers/election/proposal.reducer';

const api = new ElectionAPI();

// TODO: SÄKRA SKITEN UR DETTA

const electionResolver: Resolvers = {
  Election: {
    // Vi fyller ut resolvern med de saker som
    // skiljer ElectionResponse och Election
    creator: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.creator.username,
    })),
    electables: (electables, _, ctx) => {
      return Promise.all(
        electables.map(async (e) => {
          return ctx.postDataLoader.load(e.postname);
        }));
    },
  },
  Proposal: {
    user: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.user.username,
    })),
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.postname,
    })),
  },
  Nomination: {
    election: useDataLoader((model, context) => ({
      dataLoader: context.electionDataLoader,
      key: model.election.id,
    })),
    user: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.user.username,
    })),
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.postname,
    })),
  }
};

export default electionResolver;