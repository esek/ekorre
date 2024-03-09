import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { StrictObject } from '@/models/base';
import { stripObject } from '@/util';
import { ModifiedActivity, NewActivity, Utskott } from '@generated/graphql';
import { Prisma, PrismaActivity, PrismaActivitySource } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('ActivityAPI');

export class ActivityAPI {
  async getActivity(id: string): Promise<PrismaActivity> {
    const a = await prisma.prismaActivity.findFirst({
      where: {
        id: id,
      },
    });

    if (a == null) {
      throw new NotFoundError('Kunde inte hitta denna aktivitet!');
    }

    return a;
  }
  async getActivities(
    from: Date,
    to: Date,
    utskott: Utskott[] | null | undefined,
  ): Promise<PrismaActivity[]> {
    const whereAnd: Prisma.PrismaActivityWhereInput[] = [];

    if (utskott != null) {
      whereAnd.push({ utskott: { in: utskott } });
    }

    const a = await prisma.prismaActivity.findMany({
      where: {
        startDate: {
          lte: to,
        },
        OR: [
          {
            endDate: {
              gte: from,
            },
          },
          { AND: [{ startDate: { gte: from } }, { endDate: null }] },
        ],
        AND: whereAnd,
      },
    });

    return a;
  }

  async addActivity(activity: NewActivity): Promise<PrismaActivity> {
    const res = await prisma.prismaActivity.create({
      data: {
        source: PrismaActivitySource.WEBSITE,
        title: activity.title,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        utskott: activity.utskott as Utskott,
        imageUrl: activity.imageUrl,
        locationTitle: activity.location?.title,
        locationLink: activity.location?.link,
      },
    });

    return res;
  }
  async modifyActivity(id: string, mod: ModifiedActivity): Promise<PrismaActivity> {
    const { ...rest } = mod;

    const update: StrictObject = stripObject(rest);

    const res = prisma.prismaActivity.update({
      data: { ...update },
      where: { id: id },
    });

    return res;
  }

  async removeActivity(id: string): Promise<boolean> {
    try {
      await prisma.prismaActivity.delete({ where: { id: id } });
      return true;
    } catch {
      logger.debug(`Could not delete activity with ID ${id}`);
      throw new ServerError(
        'Kunde inte radera aktiviteten, vilket kan bero på att den inte finns.',
      );
    }
  }
}
