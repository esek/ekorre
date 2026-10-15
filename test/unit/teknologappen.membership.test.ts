import config from '@/config';
import { PostAPI } from '@api/post';
import { PrismaPost, PrismaPostHistory, PrismaUtskott } from '@prisma/client';
import TeknologappenService, { TeknologappenGroup } from '@service/teknologappen';
import {
  getPostHolders,
  planMemberChanges,
  planPostGroup,
  syncTeknologappenMemberships,
  toGroupSlug,
  toMemberId,
  toUsername,
} from '@service/teknologappen-membership';

const ME = 'api:ekorre';

const now = new Date('2026-10-08T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const group = (path: string, overrides: Partial<TeknologappenGroup> = {}): TeknologappenGroup => ({
  id: `id-${path}`,
  path,
  name: { sv: path.split('.').pop() ?? '' },
  description: {},
  limit_membership_visibility: false,
  propagate_member_visibility_access: true,
  deleted: false,
  logo_id: `logo-${path}`,
  logo_url: '',
  ...overrides,
});

const post = (overrides: Partial<PrismaPost> = {}): PrismaPost => ({
  id: 1,
  postname: 'Fotograf',
  email: null,
  utskott: PrismaUtskott.INFU,
  description: 'Tar bilder',
  spots: 2,
  postType: 'N',
  active: true,
  interviewRequired: false,
  sortPriority: 0,
  teknologappenGroupId: null,
  ...overrides,
});

const history = (
  refUser: string,
  start: Date,
  end: Date | null,
  refPost = 1,
): PrismaPostHistory => ({ id: 0, refUser, refPost, start, end });

const tree = [
  group('tlth', { admin_ids: [] }),
  group('tlth.e', { admin_ids: [ME] }),
  group('tlth.e.infu'),
  group('tlth.e.infu.fotograf'),
  group('tlth.e.nollu'),
  group('tlth.e.nollu.ph_rstarkningen', { name: { sv: 'Phørstärkningen' } }),
];

describe('toGroupSlug', () => {
  it.each([
    ['Fotograf', 'fotograf'],
    ['Vice Ordförande', 'vice_ordforande'],
    ['Sångförman', 'sangforman'],
    ['Phørstärkningen', 'phorstarkningen'],
    ['  Cafémästare / Vice  ', 'cafemastare_vice'],
  ])('%s -> %s', (name, slug) => {
    expect(toGroupSlug(name)).toBe(slug);
  });
});

describe('toUsername', () => {
  it('strips the LU prefix', () => {
    expect(toUsername('lund-university:GU1476AB-S')).toBe('gu1476ab-s');
  });

  it('ignores other identity providers and unprefixed ids', () => {
    expect(toUsername('email:informationschef@esek.se')).toBeNull();
    expect(toUsername('gu1476ab-s')).toBeNull();
  });
});

describe('toMemberId', () => {
  it('adds the LU prefix', () => {
    expect(toMemberId('GU1476AB-S')).toBe('lund-university:gu1476ab-s');
  });
});

describe('getPostHolders', () => {
  it('splits holders into current and former, with access cooldown', () => {
    const holders = getPostHolders(
      [
        history('ongoing', daysAgo(10), null),
        history('cooldown', daysAgo(100), daysAgo(5)),
        history('ended', daysAgo(100), daysAgo(40)),
        history('future', daysAgo(-5), null),
        history('reelected', daysAgo(400), daysAgo(40)),
        history('reelected', daysAgo(39), null),
      ],
      now,
      30,
    );

    const { current, former } = holders.get(1) ?? { current: new Set(), former: new Set() };
    expect([...current].sort()).toEqual(['cooldown', 'ongoing', 'reelected']);
    expect([...former]).toEqual(['ended']);
  });
});

describe('planMemberChanges', () => {
  it('adds current holders and removes only former holders', () => {
    const { add, remove } = planMemberChanges(
      [
        { user_id: 'lund-university:kept' },
        { user_id: 'lund-university:ended' },
        { user_id: 'lund-university:manual' },
        { user_id: 'email:someone@example.com' },
      ],
      { current: new Set(['kept', 'new']), former: new Set(['ended']) },
    );

    expect(add).toEqual(['new']);
    expect(remove).toEqual(['lund-university:ended']);
  });
});

describe('planPostGroup', () => {
  it('uses the linked group', () => {
    const plan = planPostGroup(
      post({ teknologappenGroupId: 'id-tlth.e.nollu.ph_rstarkningen' }),
      tree,
      new Set(),
    );
    expect(plan).toMatchObject({ kind: 'existing', link: false });
  });

  it('skips posts linked to a group that is gone', () => {
    expect(planPostGroup(post({ teknologappenGroupId: 'gone' }), tree, new Set()).kind).toBe(
      'skip',
    );
  });

  it('links a group at the post path', () => {
    const plan = planPostGroup(post(), tree, new Set());
    expect(plan).toMatchObject({
      kind: 'existing',
      link: true,
      group: { path: 'tlth.e.infu.fotograf' },
    });
  });

  it('does not link a group that belongs to another post', () => {
    expect(planPostGroup(post(), tree, new Set(['id-tlth.e.infu.fotograf'])).kind).toBe('skip');
  });

  it('moves a subgroup with the same name to the post path', () => {
    const plan = planPostGroup(
      post({ postname: 'Phørstärkningen', utskott: PrismaUtskott.NOLLU }),
      tree,
      new Set(),
    );
    expect(plan).toMatchObject({
      kind: 'rename',
      path: 'tlth.e.nollu.phorstarkningen',
      group: { path: 'tlth.e.nollu.ph_rstarkningen' },
    });
  });

  it('creates missing groups, also under missing utskott groups', () => {
    expect(planPostGroup(post({ postname: 'Webmaster' }), tree, new Set())).toEqual({
      kind: 'create',
      path: 'tlth.e.infu.webmaster',
      parentPath: 'tlth.e.infu',
    });
    expect(
      planPostGroup(
        post({ postname: 'Skattmästare', utskott: PrismaUtskott.PENGU }),
        tree,
        new Set(),
      ),
    ).toEqual({ kind: 'create', path: 'tlth.e.pengu.skattmastare', parentPath: 'tlth.e.pengu' });
  });

  it('does not sync posts in OTHER', () => {
    expect(planPostGroup(post({ utskott: PrismaUtskott.OTHER }), tree, new Set()).kind).toBe(
      'skip',
    );
  });
});

describe('syncTeknologappenMemberships', () => {
  const originalCooldown = config.POST_ACCESS_COOLDOWN_DAYS;

  beforeAll(() => {
    config.POST_ACCESS_COOLDOWN_DAYS = 30;
  });

  afterAll(() => {
    config.POST_ACCESS_COOLDOWN_DAYS = originalCooldown;
  });

  const setup = () => {
    const service = {
      getGroupTree: jest.fn().mockResolvedValue(tree.map((g) => ({ ...g }))),
      getMe: jest.fn().mockResolvedValue({ id: ME }),
      addGroupAdmin: jest.fn().mockResolvedValue(undefined),
      putGroup: jest.fn().mockResolvedValue(undefined),
      getGroupMembers: jest
        .fn()
        .mockResolvedValue([
          { user_id: 'lund-university:ended' },
          { user_id: 'lund-university:manual' },
        ]),
      addGroupMember: jest.fn().mockResolvedValue(undefined),
      removeGroupMember: jest.fn().mockResolvedValue(undefined),
    };

    const postApi = {
      getPosts: jest
        .fn()
        .mockResolvedValue([
          post(),
          post({ id: 2, postname: 'Kassör', utskott: PrismaUtskott.NOLLU }),
          post({ id: 3, postname: 'Gammal post', active: false }),
        ]),
      getHistoryEntries: jest
        .fn()
        .mockResolvedValue([
          history('ongoing', daysAgo(10), null),
          history('ended', daysAgo(100), daysAgo(40)),
          history('kassor', daysAgo(10), null, 2),
        ]),
      setTeknologappenGroupId: jest.fn().mockResolvedValue(true),
    };

    return {
      service,
      postApi,
      run: (mode: 'dry-run' | 'on', postIds?: number[]) =>
        syncTeknologappenMemberships(mode, {
          postIds,
          service: service as unknown as TeknologappenService,
          postApi: postApi as unknown as PostAPI,
          now,
        }),
    };
  };

  it('only reads in a dry run', async () => {
    const { service, postApi, run } = setup();

    const summary = await run('dry-run');

    // Fotograf members cannot be read before Ekorre is admin, Kassör is added to its new group
    expect(summary).toEqual({
      createdGroups: 1,
      renamedGroups: 0,
      linkedPosts: 2,
      addedMembers: 1,
      removedMembers: 0,
      failures: 0,
    });
    expect(service.addGroupAdmin).not.toHaveBeenCalled();
    expect(service.putGroup).not.toHaveBeenCalled();
    expect(service.addGroupMember).not.toHaveBeenCalled();
    expect(service.removeGroupMember).not.toHaveBeenCalled();
    expect(postApi.setTeknologappenGroupId).not.toHaveBeenCalled();
    expect(service.getGroupMembers).not.toHaveBeenCalled();
  });

  it('compares members in a dry run when Ekorre already is admin', async () => {
    const { service, run } = setup();
    service.getGroupTree.mockResolvedValue(
      tree.map((g) => (g.path === 'tlth.e.infu.fotograf' ? { ...g, admin_ids: [ME] } : { ...g })),
    );

    const summary = await run('dry-run', [1]);

    expect(service.getGroupMembers).toHaveBeenCalledWith('id-tlth.e.infu.fotograf');
    expect(summary).toMatchObject({ addedMembers: 1, removedMembers: 1 });
  });

  it('makes itself admin from the closest group it administers', async () => {
    const { service, run } = setup();

    await run('on', [1]);

    expect(service.addGroupAdmin.mock.calls).toEqual([
      ['id-tlth.e.infu', ME],
      ['id-tlth.e.infu.fotograf', ME],
    ]);
  });

  it('fails a post when Ekorre administers nothing above its group', async () => {
    const { service, run } = setup();
    service.getGroupTree.mockResolvedValue(tree.map((g) => ({ ...g, admin_ids: [] })));

    const summary = await run('on', [1]);

    expect(summary.failures).toBe(1);
    expect(service.addGroupAdmin).not.toHaveBeenCalled();
    expect(service.addGroupMember).not.toHaveBeenCalled();
  });

  it('only syncs the given posts', async () => {
    const { service, postApi, run } = setup();

    await run('on', [2]);

    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledTimes(1);
    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledWith(2, expect.any(String));
    expect(service.getGroupMembers).not.toHaveBeenCalled();
  });

  it('creates post groups, links posts and updates members', async () => {
    const { service, postApi, run } = setup();

    await run('on');

    // Only the post group is created, with the utskott's logo
    expect(service.putGroup).toHaveBeenCalledTimes(1);
    expect(service.putGroup).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        path: 'tlth.e.nollu.kassor',
        name: { sv: 'Kassör', en: 'Kassör' },
        logo_id: 'logo-tlth.e.nollu',
      }),
    );

    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledWith(1, 'id-tlth.e.infu.fotograf');
    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledWith(2, expect.any(String));

    expect(service.addGroupMember).toHaveBeenCalledWith(
      'id-tlth.e.infu.fotograf',
      'lund-university:ongoing',
    );
    expect(service.removeGroupMember).toHaveBeenCalledWith(
      'id-tlth.e.infu.fotograf',
      'lund-university:ended',
    );
    expect(service.removeGroupMember).toHaveBeenCalledTimes(1);
    expect(service.addGroupMember).toHaveBeenCalledWith(
      expect.any(String),
      'lund-university:kassor',
    );
  });

  it('creates a missing utskott group before the post group', async () => {
    const { service, postApi, run } = setup();
    postApi.getPosts.mockResolvedValue([
      post({ id: 2, postname: 'Kassör', utskott: PrismaUtskott.PENGU }),
    ]);

    await run('on');

    expect(service.putGroup).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({ path: 'tlth.e.pengu', logo_id: 'logo-tlth.e' }),
    );
    expect(service.putGroup).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({ path: 'tlth.e.pengu.kassor', logo_id: 'logo-tlth.e' }),
    );
    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledWith(2, expect.any(String));
  });

  it('keeps going when a post fails', async () => {
    const { service, run } = setup();
    service.getGroupMembers.mockRejectedValueOnce(new Error('403'));

    const summary = await run('on');

    expect(summary.failures).toBe(1);
    expect(service.addGroupMember).toHaveBeenCalledWith(
      expect.any(String),
      'lund-university:kassor',
    );
  });

  it('keeps a group it could not move', async () => {
    const { service, postApi, run } = setup();
    postApi.getPosts.mockResolvedValue([
      post({ postname: 'Phørstärkningen', utskott: PrismaUtskott.NOLLU }),
    ]);
    service.putGroup.mockRejectedValueOnce(new Error('403'));

    const summary = await run('on');

    expect(summary.renamedGroups).toBe(0);
    expect(postApi.setTeknologappenGroupId).toHaveBeenCalledWith(
      1,
      'id-tlth.e.nollu.ph_rstarkningen',
    );
  });
});
