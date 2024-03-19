import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { TicketAPI } from '@api/ticket';
import { ModifiedTicket, NewTicket } from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource, PrismaUtskott } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

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
};

const DUMMY_NEWTICKET: NewTicket = {
  count: 50,
  currency: 'SEK',
  name: 'TicketName',
  price: 69,
  activityID: null,
};

beforeEach(async () => {
  await ticketApi.clear();
  await prisma.prismaActivity.deleteMany();
  await prisma.prismaActivity.create({
    data: {
      ...EXISTING_ACT,
    },
  });
});

afterAll(async () => {
  await ticketApi.clear();
  await prisma.prismaActivity.deleteMany();
});

test('Adding and removing tickets', async () => {
  const notActTicket = DUMMY_NEWTICKET;
  const actTicket = { ...DUMMY_NEWTICKET, activityID: EXISTING_ACT.id };
  const falseActTicket = { ...DUMMY_NEWTICKET, activityID: 'Not an ' + EXISTING_ACT.id };

  const notActSuccess = await ticketApi.addTicket(notActTicket);
  expect(notActSuccess).toBeTruthy();

  const actSuccess = await ticketApi.addTicket(actTicket);
  expect(actSuccess).toBeTruthy();

  //Throws if activityID does not belong to an existing activity
  await expect(ticketApi.addTicket(falseActTicket)).rejects.toThrowError(
    PrismaClientKnownRequestError,
  );

  expect(await ticketApi.removeTicket(notActSuccess.id)).toBeTruthy();

  expect(await ticketApi.removeTicket(actSuccess.id)).toBeTruthy();
});

test('Modifying tickets', async () => {
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
  await expect(ticketApi.modifyTicket(actSuccess.id, falseActMod)).rejects.toThrowError(
    PrismaClientKnownRequestError,
  );

  //Modifying non existing ticket
  await expect(ticketApi.modifyTicket('not an existing ticket ID', notActMod)).rejects.toThrowError(
    NotFoundError,
  );
});
