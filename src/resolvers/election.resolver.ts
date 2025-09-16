import { useDataLoader } from '@/dataloaders';
import { Logger } from '@/logger';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated, notEmpty } from '@/util';
import { ElectionAPI } from '@api/election';
import { PostAPI } from '@api/post';
import { UserAPI } from '@api/user';
import { Feature, NominationAnswer, Resolvers } from '@generated/graphql';
import { electionReduce } from '@reducer/election/election';
import { nominationReduce } from '@reducer/election/nomination';
import { proposalReduce } from '@reducer/election/proposal';
import { sendEmail } from '@service/email';

const api = new ElectionAPI();
const userApi = new UserAPI();
const postApi = new PostAPI();

const logger = Logger.getLogger('ElectionResolver');

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
      await hasAuthenticated(ctx);
      const n = await api.getAllNominationsForUser(
        electionId,
        ctx.getUsername(),
        answer ?? undefined,
      );
      return reduce(n, nominationReduce);
    },
    numberOfNominations: async (_, { electionId, postId }, ctx) => {
      await hasAuthenticated(ctx);
      return api.getNumberOfNominations(electionId, postId ?? undefined);
    },
    numberOfProposals: async (_, { electionId, postId }, ctx) => {
      await hasAuthenticated(ctx);
      return api.getNumberOfProposals(electionId, postId ?? undefined);
    },
  },
  Mutation: {
    createElection: async (_, { electables, nominationsHidden }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const safeElectables = electables.filter(notEmpty);
      const election = await api.createElection(
        ctx.getUsername(),
        safeElectables,
        nominationsHidden,
      );

      return reduce(election, electionReduce);
    },
    addElectables: async (_, { electionId, postIds }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.addElectables(electionId, postIds ?? []);
    },
    removeElectables: async (_, { electionId, postIds }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.removeElectables(electionId, postIds ?? []);
    },
    setElectables: async (_, { electionId, postIds }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.setElectables(electionId, postIds);
    },
    setHiddenNominations: async (_, { electionId, hidden }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.setHiddenNominations(electionId, hidden);
    },
    openElection: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.openElection(electionId);
    },
    closeElection: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.closeElection(electionId);
    },
    nominate: async (_, { username, postIds }, ctx) => {
      await hasAuthenticated(ctx);
      const user = await userApi.getSingleUser(username);

      if (!user) {
        return false;
      }

      const couldNominate = api.nominate(username, postIds);

      if (!couldNominate) {
        return false;
      }

      const posts = await postApi.getMultiplePosts(postIds);

      try {
        await sendEmail(user.email, 'Du har blivit nominerad!', 'nomination', {
          firstName: user.firstName,
          posts: posts.map((p) => p.postname),
          nominationsLink: 'https://esek.se/member/election/mine',
        });
      } catch (err) {
        logger.error(`Failed to send nomination email`);
        logger.error(err);
      }

      return true;
    },
    respondToNomination: async (_, { postId, accepts }, ctx) => {
      return api.respondToNomination(ctx.getUsername(), postId, accepts);
    },
    propose: async (_, { electionId, username, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.propose(electionId, username, postId);
    },
    removeProposal: async (_, { electionId, username, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.removeProposal(electionId, username, postId);
    },
  },
  Election: {
    // Vi fyller ut resolvern med de saker som
    // skiljer ElectionResponse och Election
    creator: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.creator.username,
    })),
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
      // To prevent 0 from giving -1, thx JS very cool
      const refPosts = await api.getAllElectables(model.id === 0 ? 0 : model.id ?? -1);
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
        return [];
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
      key: model.post.id,
    })),
  },
  Nomination: {
    user: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.user.username,
    })),
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.id,
    })),
  },
};

export default electionResolver;
