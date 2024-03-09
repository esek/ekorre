import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { StrictObject } from '@/models/base';
import { stripObject } from '@/util';
import { ModifiedTicket, NewTicket } from '@generated/graphql';
import { Prisma, PrismaTicket } from '@prisma/client';

import { ActivityAPI } from './activity.api';
import prisma from './prisma';

const logger = Logger.getLogger('TicketAPI');

const activityApi = new ActivityAPI();

export class TicketAPI {
  async getTicket(id: string): Promise<PrismaTicket> {
    const t = await prisma.prismaTicket.findFirst({ where: { id: id } });

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
    if (ticket.activityID != null) {
      try {
        await activityApi.getActivity(ticket.activityID);
      } catch {
        throw new NotFoundError(
          'Biljett kunde inte skapas! Specifierad activityID existerade inte på någon activity.',
        );
      }
    }

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

  async modifyTicket(id: string, mod: ModifiedTicket): Promise<PrismaTicket> {
    if (mod.activityID != null) {
      try {
        await activityApi.getActivity(mod.activityID);
      } catch {
        throw new NotFoundError(
          'Biljett kunde inte modifieras! Modifierad activityID existerade inte på någon activity.',
        );
      }
    }

    const { ...rest } = mod;

    const update: StrictObject = stripObject(rest);

    const t = prisma.prismaTicket.update({
      data: { ...update },
      where: { id: id },
    });

    return t;
  }

  async removeTicket(id: string): Promise<boolean> {
    try {
      await prisma.prismaTicket.delete({ where: { id: id } });
      return true;
    } catch {
      logger.debug(`Could not delete ticket with ID ${id}`);
      throw new ServerError('Kunde inte radera biljetten, vilket kan bero på att den inte finns.');
    }
  }
}
