import { ElectionAPI } from '../api/election.api';
import { useDataLoader } from '../dataloaders';
import { NominationAnswer, Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { electionReduce } from '../reducers/election/election.reducer';
import { nominationReduce } from '../reducers/election/nomination.reducer';
import { proposalReduce } from '../reducers/election/proposal.reducer';
import { notEmpty } from '../util';

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
    elections: async (_, { electionIds }, ctx) => {
      return Promise.all(
        electionIds.map(async (id) => {
          return ctx.electionDataLoader.load(id);
        }),
      );
    },
    // Att användas av val-admin om nomineringar är hemliga
    hiddenNominations: async (_, { electionId, answer }) => {
      const n = await api.getAllNominations(electionId, answer ?? undefined);
      return reduce(n, nominationReduce);
    },
    myNominations: async (_, { electionId, answer }, ctx) => {
      const n = await api.getAllNominationsForUser(
        electionId,
        ctx.getUsername(),
        answer ?? undefined,
      );
      return reduce(n, nominationReduce);
    },
    numberOfNominations: async (_, { electionId, postname }) => {
      return api.getNumberOfNominations(electionId, postname ?? undefined);
    },
    numberOfProposals: async (_, { electionId, postname }) => {
      return api.getNumberOfProposals(electionId, postname ?? undefined);
    },
  },
  Mutation: {
    createElection: async (_, { electables, nominationsHidden }, ctx) => {
      const safeElectables = electables.filter(notEmpty);
      return api.createElection(ctx.getUsername(), safeElectables, nominationsHidden);
    },
    addElectables: async (_, { electionId, postnames }) => {
      return api.addElectables(electionId, postnames ?? []);
    },
    removeElectables: async (_, { electionId, postnames }) => {
      return api.removeElectables(electionId, postnames ?? []);
    },
    setHiddenNominations: async (_, { electionId, hidden }) => {
      return api.setHiddenNominations(electionId, hidden);
    },
    openElection: async (_, { electionId }) => {
      return api.openElection(electionId);
    },
    closeElection: async () => {
      return api.closeElection();
    },
    nominate: async (_, { username, postnames }) => {
      return api.nominate(username, postnames);
    },
    respondToNomination: async (_, { postname, accepts }, ctx) => {
      return api.respondToNomination(ctx.getUsername(), postname, accepts);
    },
    propose: async (_, { electionId, username, postname }) => {
      return api.propose(electionId, username, postname);
    },
    removeProposal: async (_, { electionId, username, postname }) => {
      return api.removeProposal(electionId, username, postname);
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
    acceptedNominations: async (model) => {
      // Eftersom denne bara ska returneras om valadmin tillåter
      // det kontrollerar vi detta här. I fallet att admin vill se dold
      // finns används `hiddenNominations`
      if (model.nominationsHidden ?? true) {
        return null;
      }

      // Vi vill bara visa de nomineringar där folk tackat ja
      const n = await api.getAllNominations(model.id ?? '', NominationAnswer.Yes);

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
