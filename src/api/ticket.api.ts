import { NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { devGuard, stripObject } from '@/util';
import { ModifiedTicket, NewTicket } from '@generated/graphql';
import { Prisma, PrismaTicket } from '@prisma/client';

import prisma from './prisma';

export class TicketAPI {
  async getTicket(id: string): Promise<PrismaTicket> {
    const t = await prisma.prismaTicket.findFirst({ where: { id } });

    if (t == null) {
      throw new NotFoundError('Kunde inte hitta den biljetten!');
    }

    return t;
  }

  async getTickets(activityID: string | null | undefined): Promise<PrismaTicket[]> {
    const whereAnd: Prisma.PrismaTicketWhereInput[] = [];
    if (activityID != null) {
      whereAnd.push({ activityID: activityID });
    }
    const t = await prisma.prismaTicket.findMany({
      where: {
        AND: whereAnd,
      },
    });

    return t;
  }

  async addTicket(ticket: NewTicket): Promise<PrismaTicket> {
    const t = await prisma.prismaTicket.create({
      data: {
        name: ticket.name,
        count: ticket.count,
        price: ticket.price,
        currency: ticket.currency,
        activityID: ticket.activityID,
      },
    });

    return t;
  }

  async modifyTicket(id: string, entry: ModifiedTicket): Promise<PrismaTicket> {
    const { ...rest } = entry;
    const update: StrictObject = stripObject(rest);

    const t = prisma.prismaTicket.update({
      data: { ...update },
      where: { id },
    });

    return t;
  }

  async removeTicket(id: string): Promise<PrismaTicket> {
    const t = await prisma.prismaTicket.delete({ where: { id } });
    return t;
  }

  async clear() {
    devGuard('Cannot clear tickets in production');

    await prisma.prismaTicket.deleteMany();
  }
}
