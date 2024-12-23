import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { ActivityAPI } from '@api/activity';
import { TicketAPI } from '@api/ticket';
import {
  ModifiedActivity,
  ModifiedTicket,
  NewActivity,
  NewTicket,
  Utskott,
} from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource, PrismaUtskott } from '@prisma/client';

const ticketApi = new TicketAPI();

const EXISTING_ACT: PrismaActivity = {
  id: 'ExistingID',
  source: PrismaActivitySource.WEBSITE,
  title: 'ExistingTitle',
  description: 'This is an existing activity.',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-02'),
  utskott: PrismaUtskott.INFU,
  imageUrl: 'Existing imageUrl',
  locationTitle: 'Existing location',
  locationLink: 'Existing link',
  hidden: false,
};

const DUMMY_NEWTICKET: NewTicket = {
  count: 50,
  currency: 'SEK',
  name: 'TicketName',
  price: 69,
  activityID: null,
};

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
  hidden: false,
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
  await ticketApi.clear();
  await activityApi.clear();
});

afterAll(async () => {
  await ticketApi.clear();
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

test('Adding and removing tickets', async () => {
  await prisma.prismaActivity.create({
    data: {
      ...EXISTING_ACT,
    },
  });
  const notActTicket = DUMMY_NEWTICKET;
  const actTicket = { ...DUMMY_NEWTICKET, activityID: EXISTING_ACT.id };
  const falseActTicket = { ...DUMMY_NEWTICKET, activityID: 'Not an ' + EXISTING_ACT.id };

  const notActSuccess = await ticketApi.addTicket(notActTicket);
  expect(notActSuccess).toBeTruthy();

  const actSuccess = await ticketApi.addTicket(actTicket);
  expect(actSuccess).toBeTruthy();

  //Throws if activityID does not belong to an existing activity
  await expect(ticketApi.addTicket(falseActTicket)).rejects.toThrowError();

  expect(await ticketApi.removeTicket(notActSuccess.id)).toBeTruthy();

  expect(await ticketApi.removeTicket(actSuccess.id)).toBeTruthy();
});

test('Modifying tickets', async () => {
  await prisma.prismaActivity.create({
    data: {
      ...EXISTING_ACT,
    },
  });
  const notActTicket = DUMMY_NEWTICKET;
  const actTicket = { ...DUMMY_NEWTICKET, activityID: EXISTING_ACT.id };

  const notActMod: ModifiedTicket = { name: 'New Name!' };
  const actMod: ModifiedTicket = { name: 'New Name!', activityID: EXISTING_ACT.id };
  const falseActMod: ModifiedTicket = {
    name: 'New Name!',
    activityID: 'Not an ' + EXISTING_ACT.id,
  };

  //Adding to tickets, one belonging to an existing act, one not.
  const notActSuccess = await ticketApi.addTicket(notActTicket);
  const actSuccess = await ticketApi.addTicket(actTicket);

  //Modifying ticket not belonging to an act, modifying it with still no act
  const notActModSuccess = await ticketApi.modifyTicket(notActSuccess.id, notActMod);
  expect(notActModSuccess).toBeTruthy();

  //Modifying ticket belonging to an act, modifying it with same act
  const actModSuccess = await ticketApi.modifyTicket(actSuccess.id, actMod);
  expect(actModSuccess).toBeTruthy();

  //#Tickets belonging to existing act should be 1
  expect((await ticketApi.getTickets(EXISTING_ACT.id)).length).toBe(1);

  //Modifying ticket not belonging to an act, modifying it to belong to existing act
  const newActModSuccess = await ticketApi.modifyTicket(notActSuccess.id, actMod);
  expect(newActModSuccess).toBeTruthy();

  //#Tickets belonging to existing act should be 2
  expect((await ticketApi.getTickets(EXISTING_ACT.id)).length).toBe(2);

  //#Tickets total should be 2
  expect((await ticketApi.getTickets(null)).length).toBe(2);

  //Modifying a ticket to belong to a non existing act
  await expect(ticketApi.modifyTicket(actSuccess.id, falseActMod)).rejects.toThrowError();

  //Modifying non existing ticket
  await expect(
    ticketApi.modifyTicket('not an existing ticket ID', notActMod),
  ).rejects.toThrowError();
});
