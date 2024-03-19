import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { ActivityAPI } from '@api/activity';
import { ModifiedActivity, NewActivity, Utskott } from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource, PrismaUtskott } from '@prisma/client';

const activityApi = new ActivityAPI();

let ctr = 1;

const DUMMY_PRISMAACTIVITY: PrismaActivity = {
  id: 'dummy',
  source: PrismaActivitySource.WEBSITE,
  title: 'Title',
  description: 'TestDescription',
  startDate: new Date('2024-02-03'),
  endDate: null,
  utskott: PrismaUtskott.E6,
  imageUrl: null,
  locationTitle: 'LocationTestTitle',
  locationLink: 'LocationLinkTest',
};

const DUMMY_NEWACTIVITY: NewActivity = {
  title: 'TestTitle',
  description: 'TestDescription',
  startDate: new Date('2024-02-03'),
  endDate: null,
  utskott: Utskott.E6,
  imageUrl: null,
  location: {
    title: 'LocationTestTitle',
    link: 'LocationLinkTest',
  },
};

const DUMMY_MODACTIVITY: ModifiedActivity = {
  title: 'TestTitle',
  description: 'TestDescription',
  startDate: new Date('2024-02-03'),
  endDate: null,
  utskott: Utskott.E6,
  imageUrl: null,
  location: {
    title: 'LocationTestTitle',
    link: 'LocationLinkTest',
  },
};

const generatePrismaActivity = (overrides: Partial<PrismaActivity>): PrismaActivity => {
  ctr += 1;

  const a: PrismaActivity = {
    ...DUMMY_PRISMAACTIVITY,
    ...overrides,
    id: ctr.toString(),
  };
  return a;
};

const generateNewActivity = (overrides: Partial<NewActivity>): NewActivity => {
  const a: NewActivity = {
    ...DUMMY_NEWACTIVITY,
    ...overrides,
  };
  return a;
};

const generateModActivity = (overrides: Partial<ModifiedActivity>): ModifiedActivity => {
  const a: ModifiedActivity = {
    ...DUMMY_MODACTIVITY,
    ...overrides,
  };
  return a;
};

beforeEach(async () => {
  await activityApi.clear();
});

afterAll(async () => {
  await activityApi.clear();
});

test('Getting activities', async () => {
  const orbiAct = await prisma.prismaActivity.create({
    data: {
      ...generatePrismaActivity({ source: PrismaActivitySource.ORBI }), //in date range
    },
  });
  expect(orbiAct).toBeTruthy();

  await activityApi.addActivity(generateNewActivity({})); //in range
  await activityApi.addActivity(generateNewActivity({ startDate: new Date('2024-02-01') })); //in range
  await activityApi.addActivity(
    generateNewActivity({ startDate: new Date('2024-01-10'), endDate: new Date('2024-02-10') }), //endDate in range
  );
  await activityApi.addActivity(generateNewActivity({ startDate: new Date('2024-05-01') })); //not in range
  await activityApi.addActivity(
    generateNewActivity({ startDate: new Date('2024-01-01'), endDate: new Date('2024-03-10') }), //in range
  );
  await activityApi.addActivity(
    generateNewActivity({ startDate: new Date('2024-02-10'), endDate: new Date('2024-03-10') }), //startDate in range
  );

  const acts = await activityApi.getActivities(
    new Date('2024-01-30'),
    new Date('2024-02-28'),
    Object.entries(Utskott).map((u) => u[1]),
  );

  expect(acts.length).toBe(6);

  const success = await activityApi.getActivity(orbiAct.id);
  expect(success).toBeTruthy();
});

test('Adding and removing activities', async () => {
  const orbiAct = await prisma.prismaActivity.create({
    data: {
      ...generatePrismaActivity({ source: PrismaActivitySource.ORBI }),
    },
  });
  expect(orbiAct).toBeTruthy();

  const newAct = generateNewActivity({});
  const added = await activityApi.addActivity(newAct);
  expect(added).toBeTruthy();

  const removed = await activityApi.removeActivity(added.id);
  expect(removed).toBeTruthy();

  await expect(activityApi.removeActivity(orbiAct.id)).rejects.toThrowError(BadRequestError); //Not allowed to remove non website activity

  await expect(activityApi.removeActivity('Not an existing activity ID')).rejects.toThrowError(
    NotFoundError,
  );

  const badAct = generateNewActivity({ endDate: new Date('2024-01-03') }); //endDate before startDate
  await expect(activityApi.addActivity(badAct)).rejects.toThrowError(BadRequestError);
});

test('Modifying activities', async () => {
  const orbiAct = await prisma.prismaActivity.create({
    data: {
      ...generatePrismaActivity({ source: PrismaActivitySource.ORBI }),
    },
  });
  expect(orbiAct).toBeTruthy();

  const newAct = generateNewActivity({});
  const added = await activityApi.addActivity(newAct);
  expect(added).toBeTruthy();

  //Just a new startDate is expected to work!
  const modAct = generateModActivity({ startDate: new Date('2025-01-01') });
  const modified = await activityApi.modifyActivity(added.id, modAct);
  expect(modified).toBeTruthy();

  //New endDate is before old startDate but the new starDate is before the new endDate, expected to work!
  const modAct2 = generateModActivity({
    startDate: new Date('1962-01-01'),
    endDate: new Date('1962-05-01'),
  });
  const modified2 = await activityApi.modifyActivity(added.id, modAct2);
  expect(modified2).toBeTruthy();

  //New endDate before old startDate, expected not to work!
  const badModAct = generateModActivity({ endDate: new Date('1900-01-01') });
  await expect(activityApi.modifyActivity(added.id, badModAct)).rejects.toThrowError(
    BadRequestError,
  );

  //New endDate before new startDate, expected not to work!
  const badModAct2 = generateModActivity({
    endDate: new Date('2023-01-01'),
    startDate: new Date('2024-01-01'),
  });
  await expect(activityApi.modifyActivity(added.id, badModAct2)).rejects.toThrowError(
    BadRequestError,
  );

  //Not allowed to modify non website activity, expected not to work!
  await expect(activityApi.modifyActivity(orbiAct.id, modAct)).rejects.toThrowError(
    BadRequestError,
  );
});
