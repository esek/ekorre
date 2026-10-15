import config from '@/config';
import { useDataLoader } from '@/dataloaders';
import { Logger } from '@/logger';
import type { Context } from '@/models/context';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated, notEmpty } from '@/util';
import { ElectionAPI } from '@api/election';
import { PostAPI } from '@api/post';
import { ProposalAPI } from '@api/proposal';
import { UserAPI } from '@api/user';
import { Feature, NominationAnswer, Resolvers } from '@generated/graphql';
import { PrismaProposalStatus } from '@prisma/client';
import { electionReduce } from '@reducer/election/election';
import { nominationReduce } from '@reducer/election/nomination';
import { proposalReduce } from '@reducer/election/proposal';
import { sendEmail } from '@service/email';
import {
  sendCounterCandidacyMail,
  sendProposalWithdrawnMail,
  sendProposedMail,
} from '@service/proposal-mail';

import { notifyNominationOutcome } from './interview.resolver';

const api = new ElectionAPI();
const userApi = new UserAPI();
const postApi = new PostAPI();
const proposalApi = new ProposalAPI();

const logger = Logger.getLogger('ElectionResolver');

/** Election admins see every proposal; others only accepted ones */
const isElectionAdmin = async (ctx: Context) => {
  try {
    await hasAccess(ctx, Feature.ElectionAdmin);
    return true;
  } catch {
    return false;
  }
};

const recipient = async (username: string) => {
  const { firstName, email } = await userApi.getSingleUser(username);
  return { firstName, email };
};

const electionResolver: Resolvers = {
  Query: {
    openElection: async (_, __, ctx) => {
      await hasAuthenticated(ctx);
      const elections = reduce(await api.getOpenElections(), electionReduce);
      elections.forEach((e) => {
        if (e.id) {
          ctx.electionDataLoader.prime(e.id, e);
        }
      });
      return elections;
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
    proposalOverview: async (_, { electionId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const overview = await proposalApi.getOverview(electionId);
      return overview.map((o) => ({
        post: { id: o.postId },
        proposals: reduce(o.proposals, proposalReduce),
        candidates: o.candidates.map((username) => ({ username })),
        acceptedCount: o.acceptedCount,
        counterCandidacyOpenedAt: o.counterCandidacyOpenedAt,
        canOpenCounterCandidacy: o.canOpenCounterCandidacy,
        counterCandidacies: o.counterCandidacies.map((c) => ({
          user: { username: c.refUser },
          post: { id: c.refPost },
          answer: c.answer as NominationAnswer,
          answeredAt: c.answeredAt,
        })),
      }));
    },
    myProposals: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      const p = await proposalApi.getMyProposals(electionId, ctx.getUsername());
      return reduce(p, proposalReduce);
    },
    myCounterCandidacies: async (_, { electionId }, ctx) => {
      await hasAuthenticated(ctx);
      const options = await proposalApi.getMyCounterCandidacies(electionId, ctx.getUsername());
      return options.map((o) => ({
        post: { id: o.postId },
        answer: o.answer as NominationAnswer,
        canRespond: o.canRespond,
      }));
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

      const couldNominate = await api.nominate(username, postIds);

      if (!couldNominate) {
        return false;
      }

      const posts = await postApi.getMultiplePosts(postIds);

      try {
        await sendEmail(user.email, 'Du har blivit nominerad!', 'nomination', {
          firstName: user.firstName,
          posts: posts.map((p) => p.postname),
          nominationsLink: `${config.WEBSITE_URL}/member/election/mine`,
        });
      } catch (err) {
        logger.error(`Failed to send nomination email`);
        logger.error(err);
      }

      return true;
    },
    respondToNomination: async (_, { postId, accepts, expectedEffect, rebook }, ctx) => {
      const username = ctx.getUsername();
      const { electionId, outcome, rebooked } = await api.respondToNomination(
        username,
        postId,
        accepts,
        {
          expectedEffect: expectedEffect ?? undefined,
          rebook: rebook ?? undefined,
        },
      );
      await notifyNominationOutcome(electionId, username, outcome, rebooked);
      return true;
    },
    propose: async (_, { electionId, username, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      await proposalApi.propose(electionId, username, postId);
      return true;
    },
    removeProposal: async (_, { electionId, username, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { notify } = await proposalApi.removeProposal(electionId, username, postId);
      if (notify) {
        const [to, post] = await Promise.all([recipient(username), postApi.getPost(postId)]);
        await sendProposalWithdrawnMail(electionId, to, post.postname);
      }
      return true;
    },
    sendProposals: async (_, { electionId, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { usernames, deadline } = await proposalApi.sendProposals(electionId, postId);
      const post = await postApi.getPost(postId);
      await Promise.all(
        usernames.map(async (username) =>
          sendProposedMail(electionId, await recipient(username), post.postname, deadline),
        ),
      );
      return usernames.length;
    },
    respondToProposal: async (_, { electionId, postId, accepts }, ctx) => {
      await hasAuthenticated(ctx);
      await proposalApi.respondToProposal(electionId, postId, ctx.getUsername(), accepts);
      return true;
    },
    openCounterCandidacy: async (_, { electionId, postId }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      const { usernames, deadline } = await proposalApi.openCounterCandidacy(electionId, postId);
      const post = await postApi.getPost(postId);
      await Promise.all(
        usernames.map(async (username) =>
          sendCounterCandidacyMail(electionId, await recipient(username), post.postname, deadline),
        ),
      );
      return true;
    },
    respondToCounterCandidacy: async (_, { electionId, postId, accepts }, ctx) => {
      await hasAuthenticated(ctx);
      await proposalApi.respondToCounterCandidacy(electionId, postId, ctx.getUsername(), accepts);
      return true;
    },
    setProposalDeadline: async (_, { electionId, deadline }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      await proposalApi.setDeadline(electionId, deadline);
      ctx.electionDataLoader.clear(electionId);
      return true;
    },
    setProposalStatus: async (_, { electionId, username, postId, status }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      await proposalApi.setProposalStatus(
        electionId,
        username,
        postId,
        status as PrismaProposalStatus,
      );
      return true;
    },
    setCounterCandidacy: async (_, { electionId, username, postId, answer }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      await proposalApi.setCounterCandidacy(electionId, username, postId, answer ?? null);
      return true;
    },
    renameElection: async (_, { electionId, name }, ctx) => {
      await hasAccess(ctx, Feature.ElectionAdmin);
      return api.renameElection(electionId, name ?? null);
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
    proposals: async (model, _, ctx) => {
      const p = await proposalApi.getProposals(model.id ?? -1);
      const visible = (await isElectionAdmin(ctx))
        ? p
        : p.filter((proposal) => proposal.status === PrismaProposalStatus.ACCEPTED);
      return reduce(visible, proposalReduce);
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
  CounterCandidacy: {
    user: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.user.username,
    })),
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.id,
    })),
  },
  CounterCandidacyOption: {
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.id,
    })),
  },
  ProposalPostOverview: {
    post: useDataLoader((model, context) => ({
      dataLoader: context.postDataLoader,
      key: model.post.id,
    })),
    candidates: (model, _, ctx) =>
      Promise.all(model.candidates.map((u) => ctx.userDataLoader.load(u.username ?? ''))),
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
