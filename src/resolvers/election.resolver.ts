import { useDataLoader } from '@/dataloaders';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated, notEmpty } from '@/util';
import { ElectionAPI } from '@api/election';
import { Feature, NominationAnswer, Resolvers } from '@generated/graphql';
import { electionReduce } from '@reducer/election/election';
import { nominationReduce } from '@reducer/election/nomination';
import { proposalReduce } from '@reducer/election/proposal';

const api = new ElectionAPI();

const electionResolver: Resolvers = {
  Query: {
    openElection: async (_, __, ctx) => {
      await hasAuthenticated(ctx);
      const e = reduce(await api.getOpenElection(), electionReduce);
      if (e.id) {
        ctx.electionDataLoader.prime(e.id, e);
      }
      return e;
    },
    latestElections: async (_, { limit, includeUnopened, includeHiddenNominations }, ctx) => {
      await hasAuthenticated(ctx);
      const e = await api.getLatestElections(
        limit ?? undefined,
        includeUnopened ?? true,
        includeHiddenNominations ?? true,
      );
      return reduce(e, electionReduce);
    },
    election: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      return ctx.electionDataLoader.load(electionId);
    },
    elections: async (_, { electionIds }, ctx) => {
      await hasAuthenticated(ctx);
      return Promise.all(
        electionIds.map(async (id) => {
          return ctx.electionDataLoader.load(id);
        }),
      );
    },
    // Att användas av val-admin om nomineringar är hemliga
    hiddenNominations: async (_, { electionId, answer }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
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
      await hasAccess(ctx, Feature.ElectionAdmin);
      const safeElectables = electables.filter(notEmpty);
      return api.createElection(ctx.getUsername(), safeElectables, nominationsHidden);
    },
    addElectables: async (_, { electionId, postnames }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.addElectables(electionId, postnames ?? []);
    },
    removeElectables: async (_, { electionId, postnames }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.removeElectables(electionId, postnames ?? []);
    },
    setElectables: async (_, { electionId, postnames }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.setElectables(electionId, postnames);
    },
    setHiddenNominations: async (_, { electionId, hidden }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.setHiddenNominations(electionId, hidden);
    },
    openElection: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.openElection(electionId);
    },
    closeElection: async (_, _1, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.closeElection();
    },
    nominate: async (_, { username, postnames }, ctx) => {
      await hasAuthenticated(ctx);
      return api.nominate(username, postnames);
    },
    respondToNomination: async (_, { postname, accepts }, ctx) => {
      return api.respondToNomination(ctx.getUsername(), postname, accepts);
    },
    propose: async (_, { electionId, username, postname }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.propose(electionId, username, postname);
    },
    removeProposal: async (_, { electionId, username, postname }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
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
      const refPosts = await api.getAllElectables(model.id ?? -1);
      return Promise.all(
        refPosts.map(async (e) => {
          return ctx.postDataLoader.load(e);
        }),
      );
    },
    proposals: async (model) => {
      const p = await api.getAllProposals(model.id ?? -1);
      return reduce(p, proposalReduce);
    },
    acceptedNominations: async (model) => {
      // Eftersom denna bara ska returneras om valadmin tillåter
      // det kontrollerar vi detta här. I fallet att admin vill se dold
      // används `hiddenNominations`
      if (model.nominationsHidden ?? true) {
        return null;
      }

      // Vi vill bara visa de nomineringar där folk tackat ja
      const n = await api.getAllNominations(model.id ?? -1, NominationAnswer.Yes);

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
      key: model.post.slug,
    })),
  },
  Nomination: {
    user: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.user.username,
    })),
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.slug,
    })),
  },
};

export default electionResolver;
