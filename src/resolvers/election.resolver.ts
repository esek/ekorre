import { ElectionAPI } from '../api/election.api';
import { useDataLoader } from '../dataloaders';
import type { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { electionReduce } from '../reducers/election/election.reducer';
import { nominationReduce } from '../reducers/election/nomination.reducer';
import { proposalReduce } from '../reducers/election/proposal.reducer';

const api = new ElectionAPI();

const electionResolver: Resolvers = {
  Query: {
    openElection: async (_, __, ctx) => {
      const e = reduce(await api.getOpenElection(), electionReduce);
      ctx.electionDataLoader.prime(e.id ?? '', e);
      return e;
    },
    latestElections: async (_, { limit }) => {
      const e = await api.getLatestElections(limit ?? undefined);
      return reduce(e, electionReduce);
    },
    election: async (_, { electionId }, ctx) => {
      return ctx.electionDataLoader.load(electionId);
    },
    elections: async (_, { electiondIds }, ctx) => {
      return Promise.all(
        electiondIds.map(async (id) => {
          return ctx.electionDataLoader.load(id);
        }),
      );
    },
    // Att användas av val-admin om nomineringar är hemliga
    hiddenNominations: async (_, { electionId }) => {
      const n = await api.getAllNominations(electionId);
      return reduce(n, nominationReduce);
    },
    myNominations: async (_, { electionId }, ctx) => {
      const n = await api.getAllNominationsForUser(electionId, ctx.getUsername());
      return reduce(n, nominationReduce);
    },
    numberOfNominations: async (_, { electionId, postname }) => {
      return api.getNumberOfNominations(electionId, postname ?? undefined);
    },
  },
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
    nominations: async (model) => {
      // Eftersom denne bara ska returneras om valadmin tillåter
      // det kontrollerar vi detta här. I fallet att admin vill se dold
      // finns används `hiddenNominations`
      if (model.nominationsHidden ?? true) {
        return null;
      }
      const n = await api.getAllNominations(model.id ?? '');
      return reduce(n, nominationReduce);
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
