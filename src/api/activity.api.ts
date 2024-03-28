import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { devGuard, stripObject } from '@/util';
import { ModifiedActivity, NewActivity, Utskott } from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource } from '@prisma/client';

import prisma from './prisma';

export class ActivityAPI {
  async getActivity(id: string): Promise<PrismaActivity> {
    const a = await prisma.prismaActivity.findFirst({
      where: {
        id,
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
    utskott: Utskott[] = [Utskott.Other],
  ): Promise<PrismaActivity[]> {
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
        AND: { utskott: { in: utskott } },
      },
      orderBy: { startDate: 'asc' },
    });

    return a;
  }

  async addActivity(activity: NewActivity): Promise<PrismaActivity> {
    const isAcceptableTime = () => {
      const { startDate, endDate } = activity;

      if (!endDate) {
        return true;
      }

      return endDate.getTime() - startDate.getTime() >= 0;
    };

    if (!isAcceptableTime()) {
      throw new BadRequestError('Sluttid för aktivitet är före starttid!');
    }

    const res = await prisma.prismaActivity.create({
      data: {
        source: PrismaActivitySource.WEBSITE,
        title: activity.title,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        utskott: activity.utskott ?? Utskott.Other,
        imageUrl: activity.imageUrl,
        locationTitle: activity.location?.title,
        locationLink: activity.location?.link,
      },
    });

    return res;
  }
  async modifyActivity(id: string, entry: ModifiedActivity): Promise<PrismaActivity> {
    const a = await this.getActivity(id);

    const isAcceptableTime = () => {
      const { startDate, endDate } = entry;

      if (endDate) {
        if (startDate) {
          return endDate.getTime() - startDate.getTime() >= 0;
        }
        return endDate.getTime() - a.startDate.getTime() >= 0;
      } else if (startDate) {
        if (!a.endDate) {
          return true;
        }
        return a.endDate.getTime() - startDate.getTime() >= 0;
      }

      return true;
    };

    if (!isAcceptableTime()) {
      throw new BadRequestError('Ny slut- och starttid för aktivitet är omöjlig!');
    }

    if (a.source !== PrismaActivitySource.WEBSITE) {
      throw new BadRequestError(
        'Ej tillåtet att ändra i evenemang som inte är skapade på hemsidan!',
      );
    }

    const { location, ...reduced } = entry;

    const refact = {
      ...reduced,
      locationTitle: entry.location?.title,
      locationLink: entry.location?.link,
    };

    const update: StrictObject = stripObject(refact);

    const res = await prisma.prismaActivity.update({
      data: { ...update },
      where: { id },
    });
    return res;
  }

  async removeActivity(id: string): Promise<PrismaActivity> {
    const a = await this.getActivity(id);
    if (a.source !== PrismaActivitySource.WEBSITE) {
      throw new BadRequestError(
        'Ej tillåtet att ta bort evenemang som inte är skapade på hemsidan!',
      );
    }
    const res = await prisma.prismaActivity.delete({ where: { id } });

    return res;
  }

  async clear() {
    devGuard('Cannot clear activities in production');

    await prisma.prismaActivity.deleteMany();
  }
}
