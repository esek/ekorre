import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { NewActivity, Utskott } from '@generated/graphql';
import { Prisma, PrismaEvent } from '@prisma/client';

import { OrbiAPI } from './orbi.api';
import prisma from './prisma';

const logger = Logger.getLogger('ActivityAPI');

const defaultOrder: Prisma.PrismaEventOrderByWithRelationAndSearchRelevanceInput[] = [
  {
    startDate: 'desc',
  },
  {
    title: 'asc',
  },
];

const orbiApi = new OrbiAPI();

export class ActivityAPI {
  async getActivites(from: Date, to: Date, utskott: Utskott[]): Promise<PrismaEvent[]> {
    if (!utskott) utskott = Object.values(Utskott);
    orbiApi.updateActivities();
    const a = await prisma.prismaEvent.findMany({
      where: {
        startDate: {
          gte: from,
          lte: to,
        },
        utskott: { in: utskott },
      },
      orderBy: defaultOrder,
    });
    return a;
  }

  async getAllActivities(): Promise<PrismaEvent[]> {
    const a = await prisma.prismaEvent.findMany({
      orderBy: defaultOrder,
    });
    return a;
  }

  // prettier-ignore
  async addActivity({ title, description, startDate, endDate, utskott, location }: NewActivity): Promise<boolean> {
    try{
      await prisma.prismaEvent.create({
        data: {
          title,
          description,
          startDate,
          endDate,
          utskott,
          location,
        },
      });
      return true;
    } catch (err) {
      logger.debug(
        `Could not create activity titled ${title} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError(
        'Kunde inte skapa evenemanget',
      );
    }
  }

  async removeActivity(id: string): Promise<boolean> {
    try {
      await prisma.prismaEvent.delete({
        where: {
          refKey: id,
        },
      });
      return true;
    } catch {
      logger.debug(`Could not delete activity with refKey ${id}`);
      throw new ServerError('Kunde inte radera evenemanget, vilket kan bero på att det inte finns');
    }
  }

  async clear() {
    await prisma.prismaEvent.deleteMany();
  }
}
