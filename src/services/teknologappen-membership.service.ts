import config from '@/config';
import { Logger } from '@/logger';
import { PostAPI } from '@api/post';
import { PrismaPost, PrismaPostHistory, PrismaUtskott } from '@prisma/client';
import TeknologappenService, {
  TEKNOLOGAPPEN_UTSKOTT_PATHS,
  TeknologappenGroup,
  TeknologappenPutGroup,
  TeknologappenUser,
} from '@service/teknologappen';
import { randomUUID } from 'crypto';

const logger = Logger.getLogger('TeknologappenMemberships');

const GUILD_PATH = TEKNOLOGAPPEN_UTSKOTT_PATHS.OTHER;
const LU_PREFIX = 'lund-university:';

// Gives several quick edits in Ekorre time to land before syncing them
const REQUEST_DELAY_MS = 30 * 1000;

/**
 * Posts in these utskott are not synced. Posts in OTHER would end up directly
 * under the guild group, which is not wanted yet
 */
const UNSYNCED_UTSKOTT: ReadonlySet<PrismaUtskott> = new Set([PrismaUtskott.OTHER]);

/**
 * Names used if an utskott group is missing in Teknologappen and has to be created
 */
const UTSKOTT_NAMES: Record<PrismaUtskott, string> = {
  CM: 'Cafémästeriet',
  E6: 'E6',
  ENU: 'Näringslivsutskottet',
  FVU: 'Förvaltningsutskottet',
  INFU: 'InfU',
  KM: 'KM',
  NOJU: 'NöjU',
  NOLLU: 'NollU',
  OTHER: 'E-sektionen',
  PENGU: 'Pengautskottet',
  SRE: 'Studierådet',
  STYRELSEN: 'E-sektionens Styrelse',
};

export type MembershipSyncMode = 'dry-run' | 'on';

/**
 * Users holding a post right now (including the access cooldown), and users
 * whose terms on it have all ended
 */
export type PostHolders = {
  current: Set<string>;
  former: Set<string>;
};

export type GroupPlan =
  | { kind: 'existing'; group: TeknologappenGroup; link: boolean }
  | { kind: 'rename'; group: TeknologappenGroup; path: string }
  | { kind: 'create'; path: string; parentPath: string }
  | { kind: 'skip'; reason: string };

export type MembershipSyncSummary = {
  createdGroups: number;
  renamedGroups: number;
  linkedPosts: number;
  addedMembers: number;
  removedMembers: number;
  failures: number;
};

type GroupIndex = {
  byId: Map<string, TeknologappenGroup>;
  byPath: Map<string, TeknologappenGroup>;
};

/**
 * Turns a name into a group path segment, e.g. `Vice Ordförande` -> `vice_ordforande`
 */
export const toGroupSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/**
 * Converts a Teknologappen user id to an Ekorre username. Ekorre usernames
 * are LU ids, so users from other identity providers have none
 */
export const toUsername = (userId: string): string | null => {
  const id = userId.toLowerCase();
  return id.startsWith(LU_PREFIX) ? id.slice(LU_PREFIX.length) : null;
};

/**
 * Teknologappen does not prefix ids itself, an unprefixed id becomes an account of its own
 */
export const toMemberId = (username: string): string => `${LU_PREFIX}${username.toLowerCase()}`;

const parentPathOf = (path: string): string => path.slice(0, path.lastIndexOf('.'));

/**
 * Groups post history by post. A term counts as current from its start until
 * `cooldownDays` after its end, mirroring post access in Ekorre
 */
export const getPostHolders = (
  history: PrismaPostHistory[],
  now: Date,
  cooldownDays: number,
): Map<number, PostHolders> => {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - cooldownDays);

  const holders = new Map<number, PostHolders>();

  history.forEach((entry) => {
    // Terms that have not started do not affect membership yet
    if (entry.start >= now) {
      return;
    }

    const postHolders = holders.get(entry.refPost) ?? { current: new Set(), former: new Set() };
    holders.set(entry.refPost, postHolders);

    const username = entry.refUser.toLowerCase();
    if (entry.end == null || entry.end > cutoff) {
      postHolders.current.add(username);
    } else {
      postHolders.former.add(username);
    }
  });

  // Someone with a new term is not a former holder
  holders.forEach(({ current, former }) => current.forEach((u) => former.delete(u)));

  return holders;
};

/**
 * Members to add are current holders missing from the group. Only former
 * holders are removed, members added outside Ekorre are left alone
 * @returns Usernames to add, and Teknologappen user ids to remove
 */
export const planMemberChanges = (
  members: TeknologappenUser[],
  holders: PostHolders,
): { add: string[]; remove: string[] } => {
  const memberUsernames = new Set(members.map((m) => toUsername(m.user_id)));

  const add = [...holders.current].filter((u) => !memberUsernames.has(u)).sort();
  const remove = members
    .filter((m) => {
      const username = toUsername(m.user_id);
      return username != null && holders.former.has(username);
    })
    .map((m) => m.user_id)
    .sort();

  return { add, remove };
};

const indexGroups = (groups: TeknologappenGroup[]): GroupIndex => ({
  byId: new Map(groups.map((g) => [g.id, g])),
  byPath: new Map(groups.map((g) => [g.path, g])),
});

/**
 * Decides which Teknologappen group a post belongs to. A post that is already
 * linked keeps its group. Otherwise a group is looked for at the post's path,
 * then among the utskott's subgroups by name, and finally a new one is created
 * @param linkedIds Groups already linked to some post
 */
export const planPostGroup = (
  post: PrismaPost,
  groups: TeknologappenGroup[],
  linkedIds: ReadonlySet<string>,
): GroupPlan => {
  const { byId, byPath } = indexGroups(groups);

  if (post.teknologappenGroupId) {
    const group = byId.get(post.teknologappenGroupId);
    if (!group || group.deleted) {
      return { kind: 'skip', reason: `linked group ${post.teknologappenGroupId} does not exist` };
    }
    return { kind: 'existing', group, link: false };
  }

  if (UNSYNCED_UTSKOTT.has(post.utskott)) {
    return { kind: 'skip', reason: `posts in ${post.utskott} are not synced` };
  }

  const slug = toGroupSlug(post.postname);
  if (!slug) {
    return { kind: 'skip', reason: 'the post name gives an empty path' };
  }

  const parentPath = TEKNOLOGAPPEN_UTSKOTT_PATHS[post.utskott];
  const path = `${parentPath}.${slug}`;

  const atPath = byPath.get(path);
  if (atPath) {
    if (atPath.deleted) {
      return { kind: 'skip', reason: `${path} belongs to a hidden group` };
    }
    if (linkedIds.has(atPath.id)) {
      return { kind: 'skip', reason: `${path} is already linked to another post` };
    }
    return { kind: 'existing', group: atPath, link: true };
  }

  const sameName = groups.find(
    (g) =>
      !g.deleted &&
      !linkedIds.has(g.id) &&
      parentPathOf(g.path) === parentPath &&
      toGroupSlug(g.name.sv ?? '') === slug,
  );
  if (sameName) {
    return { kind: 'rename', group: sameName, path };
  }

  return { kind: 'create', path, parentPath };
};

const toPutGroup = (group: TeknologappenGroup): TeknologappenPutGroup => ({
  path: group.path,
  name: group.name,
  description: group.description,
  limit_membership_visibility: group.limit_membership_visibility,
  propagate_member_visibility_access: group.propagate_member_visibility_access,
  logo_id: group.logo_id,
});

/**
 * A new group with its parent's logo and visibility settings
 */
const newChildGroup = (
  parent: TeknologappenGroup,
  path: string,
  name: string,
  description: string,
): TeknologappenPutGroup => ({
  path,
  name: { sv: name, en: name },
  description: { sv: description, en: description },
  limit_membership_visibility: parent.limit_membership_visibility,
  propagate_member_visibility_access: parent.propagate_member_visibility_access,
  logo_id: parent.logo_id,
});

// The creator of a group becomes its admin
const asGroup = (
  id: string,
  group: TeknologappenPutGroup,
  creatorId: string,
): TeknologappenGroup => ({
  ...group,
  id,
  deleted: false,
  logo_url: '',
  admin_ids: [creatorId],
});

export type MembershipSyncOptions = {
  /** Only sync these posts, e.g. when testing against the real app */
  postIds?: number[];
  service?: TeknologappenService;
  postApi?: PostAPI;
  now?: Date;
};

/**
 * Makes post groups in Teknologappen mirror who holds each post in Ekorre.
 * Groups are created when missing but never deleted, and only members whose
 * terms have ended are removed. Ekorre makes itself admin of the groups it
 * needs, starting from a group it already administers
 * @param mode `dry-run` only logs what would be done
 */
export const syncTeknologappenMemberships = async (
  mode: MembershipSyncMode,
  {
    postIds,
    service = new TeknologappenService(),
    postApi = new PostAPI(),
    now = new Date(),
  }: MembershipSyncOptions = {},
): Promise<MembershipSyncSummary> => {
  const dryRun = mode === 'dry-run';
  const summary: MembershipSyncSummary = {
    createdGroups: 0,
    renamedGroups: 0,
    linkedPosts: 0,
    addedMembers: 0,
    removedMembers: 0,
    failures: 0,
  };

  const act = async (description: string, action: () => Promise<unknown>) => {
    if (dryRun) {
      logger.log(`[dry-run] ${description}`);
      return;
    }
    logger.log(description);
    await action();
  };

  const [groups, allPosts, history, me] = await Promise.all([
    service.getGroupTree(),
    postApi.getPosts(undefined, true),
    postApi.getHistoryEntries(),
    service.getMe(),
  ]);

  const posts = postIds ? allPosts.filter((p) => postIds.includes(p.id)) : allPosts;
  const { byPath } = indexGroups(groups);
  // Adminships only granted in a dry run, members of those groups cannot be read
  const pretendAdminIds = new Set<string>();
  const holdersByPost = getPostHolders(history, now, config.POST_ACCESS_COOLDOWN_DAYS);
  const linkedIds = new Set(
    posts.map((p) => p.teknologappenGroupId).filter((id): id is string => id != null),
  );

  const addGroup = (group: TeknologappenGroup) => {
    groups.push(group);
    byPath.set(group.path, group);
  };

  /**
   * Adminship can be granted by an admin of the parent, so this climbs
   * towards a group Ekorre already administers
   */
  const ensureAdmin = async (group: TeknologappenGroup): Promise<void> => {
    if (group.admin_ids?.includes(me.id)) {
      return;
    }

    const parent = byPath.get(parentPathOf(group.path));
    if (!parent) {
      throw new Error(`Ekorre is not admin of ${group.path} or any group above it`);
    }
    await ensureAdmin(parent);

    await act(`Making Ekorre admin of ${group.path}`, () => service.addGroupAdmin(group.id, me.id));
    group.admin_ids = [...(group.admin_ids ?? []), me.id];
    if (dryRun) {
      pretendAdminIds.add(group.id);
    }
  };

  const ensureUtskottGroup = async (path: string, utskott: PrismaUtskott) => {
    const existing = byPath.get(path);
    if (existing) {
      if (existing.deleted) {
        throw new Error(`utskott group ${path} is hidden`);
      }
      return existing;
    }

    const guild = byPath.get(GUILD_PATH);
    if (!guild) {
      throw new Error(`guild group ${GUILD_PATH} does not exist`);
    }

    await ensureAdmin(guild);
    const id = randomUUID();
    const group = newChildGroup(guild, path, UTSKOTT_NAMES[utskott], '');
    await act(`Creating utskott group ${path}`, () => service.putGroup(id, group));
    summary.createdGroups += 1;

    const created = asGroup(id, group, me.id);
    addGroup(created);
    return created;
  };

  const link = async (post: PrismaPost, group: TeknologappenGroup) => {
    await act(`Linking post ${post.postname} to ${group.path}`, () =>
      postApi.setTeknologappenGroupId(post.id, group.id),
    );
    linkedIds.add(group.id);
    summary.linkedPosts += 1;
  };

  /**
   * @returns The post's group, and if it existed before this sync (and may have members)
   */
  const resolveGroup = async (
    post: PrismaPost,
  ): Promise<{ group: TeknologappenGroup; exists: boolean } | null> => {
    const plan = planPostGroup(post, groups, linkedIds);

    switch (plan.kind) {
      case 'skip':
        logger.warn(`Skipping post ${post.postname}: ${plan.reason}`);
        return null;

      case 'existing':
        if (plan.link) {
          await link(post, plan.group);
        }
        return { group: plan.group, exists: true };

      case 'rename': {
        const oldPath = plan.group.path;
        try {
          // Moving needs adminship of the group itself and of its parent
          await ensureAdmin(plan.group);
          await act(`Moving group ${oldPath} to ${plan.path} for post ${post.postname}`, () =>
            service.putGroup(plan.group.id, { ...toPutGroup(plan.group), path: plan.path }),
          );
          byPath.delete(oldPath);
          plan.group.path = plan.path;
          byPath.set(plan.path, plan.group);
          summary.renamedGroups += 1;
        } catch (error) {
          // Teknologappen admins can fix the path, the group is still the right one
          logger.warn(`Could not move ${oldPath} to ${plan.path}, keeping it: ${String(error)}`);
        }
        await link(post, plan.group);
        return { group: plan.group, exists: true };
      }

      case 'create': {
        const parent = await ensureUtskottGroup(plan.parentPath, post.utskott);
        await ensureAdmin(parent);
        const id = randomUUID();
        const group = newChildGroup(parent, plan.path, post.postname, post.description);
        await act(`Creating group ${plan.path} for post ${post.postname}`, () =>
          service.putGroup(id, group),
        );
        summary.createdGroups += 1;

        const created = asGroup(id, group, me.id);
        addGroup(created);
        await link(post, created);
        return { group: created, exists: false };
      }
    }
  };

  const syncMembers = async (post: PrismaPost, group: TeknologappenGroup, exists: boolean) => {
    const holders = holdersByPost.get(post.id) ?? { current: new Set(), former: new Set() };

    if (exists) {
      await ensureAdmin(group);
      if (pretendAdminIds.has(group.id)) {
        logger.log(`[dry-run] Members of ${group.path} can be compared once Ekorre is admin`);
        return;
      }
    }

    const members = exists ? await service.getGroupMembers(group.id) : [];
    const { add, remove } = planMemberChanges(members, holders);

    for (const username of add) {
      try {
        await act(`Adding ${username} to ${group.path}`, () =>
          service.addGroupMember(group.id, toMemberId(username)),
        );
        summary.addedMembers += 1;
      } catch (error) {
        summary.failures += 1;
        logger.error(`Could not add ${username} to ${group.path}: ${String(error)}`);
      }
    }

    for (const userId of remove) {
      try {
        await act(`Removing ${userId} from ${group.path}`, () =>
          service.removeGroupMember(group.id, userId),
        );
        summary.removedMembers += 1;
      } catch (error) {
        summary.failures += 1;
        logger.error(`Could not remove ${userId} from ${group.path}: ${String(error)}`);
      }
    }
  };

  for (const post of posts) {
    // Inactive posts are only kept in sync if they already have a group
    if (!post.active && !post.teknologappenGroupId) {
      continue;
    }

    try {
      const resolved = await resolveGroup(post);
      if (resolved) {
        await syncMembers(post, resolved.group, resolved.exists);
      }
    } catch (error) {
      summary.failures += 1;
      logger.error(`Could not sync post ${post.postname}: ${String(error)}`);
    }
  }

  return summary;
};

let syncInProgress = false;
let syncRequestedDuringRun = false;
let requestTimer: NodeJS.Timeout | null = null;

/**
 * Runs the membership sync in the mode set by `TEKNOLOGAPPEN_MEMBERSHIP_SYNC`.
 * Requests made during a run trigger one more run afterwards
 */
export const runTeknologappenMembershipSync = async () => {
  const mode = config.TEKNOLOGAPPEN.MEMBERSHIP_SYNC;
  if (mode === 'off') {
    return;
  }

  if (syncInProgress) {
    syncRequestedDuringRun = true;
    return;
  }

  syncInProgress = true;
  try {
    do {
      syncRequestedDuringRun = false;
      const s = await syncTeknologappenMemberships(mode);
      logger.log(
        `${mode === 'dry-run' ? '[dry-run] ' : ''}Synced post memberships to Teknologappen: ` +
          `${s.createdGroups} groups created, ${s.renamedGroups} moved, ${s.linkedPosts} posts linked, ` +
          `${s.addedMembers} members added, ${s.removedMembers} removed, ${s.failures} failures`,
      );
    } while (syncRequestedDuringRun);
  } catch (error) {
    logger.error(`Teknologappen membership synchronization failed: ${String(error)}`);
  } finally {
    syncInProgress = false;
  }
};

/**
 * Schedules a sync shortly after posts or post history change in Ekorre
 */
export const requestTeknologappenMembershipSync = () => {
  if (config.TEKNOLOGAPPEN.MEMBERSHIP_SYNC === 'off') {
    return;
  }

  if (requestTimer) {
    clearTimeout(requestTimer);
  }
  requestTimer = setTimeout(() => {
    requestTimer = null;
    void runTeknologappenMembershipSync();
  }, REQUEST_DELAY_MS);
  requestTimer.unref();
};
