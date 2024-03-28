import { Ticket } from '@generated/graphql';
import { PrismaTicket } from '@prisma/client';

export const ticketReducer = (dbTicket: PrismaTicket): Ticket => {
  return dbTicket as Ticket;
};
