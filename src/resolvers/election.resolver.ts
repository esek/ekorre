import { ElectionAPI } from '../api/election.api';
import { useDataLoader } from '../dataloaders';
import type { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { proposalReduce } from '../reducers/election/proposal.reducer';

const api = new ElectionAPI();

const electionResolver: Resolvers = {
  Election: {
    // Vi fyller ut resolvern med de saker som
    // skiljer ElectionResponse och Election
    creator: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.creator.username,
    })),
    createdAt: (model) => new Date(model.createdAt),
    openedAt: (model) => {
      if (model.openedAt != null) {
        return new Date(model.openedAt);
      }
      return null;
    },
    closedAt: (model) => {
      if (model.closedAt != null) {
        return new Date(model.closedAt);
      }
      return null;
    },
    electables: async (model, _, ctx) => {
      const refposts = await api.getAllElectables(model.id ?? '');
      return Promise.all(
        refposts.map(async (e) => {
          return ctx.postDataLoader.load(e);
        }),
      );
    },
    proposals: async (model) => {
      const p = await api.getAllProposals(model.id ?? '');
      return reduce(p, proposalReduce);
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
  },
};

export default electionResolver;
