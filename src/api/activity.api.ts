import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { devGuard, stripObject } from '@/util';
import { ModifiedActivity, NewActivity, Utskott } from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource } from '@prisma/client';

import prisma from './prisma';

export class ActivityAPI {
  async getActivity(id: string): Promise<PrismaActivity> {
    const activity = await prisma.prismaActivity.findFirst({
      where: {
        id,
      },
    });

    if (activity == null) {
      throw new NotFoundError('Kunde inte hitta denna aktivitet!');
    }

    return activity;
  }
  async getActivities(
    from: Date,
    to: Date,
    utskott: Utskott[] = [Utskott.Other],
    includeHidden = false,
  ): Promise<PrismaActivity[]> {
    //Acts where (start < to) && ((end > from) || ((start > from) && (end == null)))
    const dateFilters = {
      startDate: { lte: to },
      OR: [{ endDate: { gte: from } }, { AND: [{ startDate: { gte: from } }, { endDate: null }] }],
    };

    //Only acts in utskott[]
    const utskottFilter = { utskott: { in: utskott } };

    //If includeHidden, get all acts, else only the visible ones
    const hiddenFilter = includeHidden ? {} : { OR: [{ hidden: false }] };

    const activities = await prisma.prismaActivity.findMany({
      where: {
        ...dateFilters,
        AND: [utskottFilter, hiddenFilter],
      },
      orderBy: { startDate: 'asc' },
    });

    return activities;
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

    const addedActivity = await prisma.prismaActivity.create({
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
        hidden: activity.hidden ?? false,
      },
    });

    return addedActivity;
  }
  async modifyActivity(id: string, entry: ModifiedActivity): Promise<PrismaActivity> {
    const activity = await this.getActivity(id);

    const isAcceptableTime = () => {
      const { startDate, endDate } = entry;

      if (endDate) {
        if (startDate) {
          return endDate.getTime() - startDate.getTime() >= 0;
        }
        return endDate.getTime() - activity.startDate.getTime() >= 0;
      } else if (startDate) {
        if (!activity.endDate) {
          return true;
        }
        return activity.endDate.getTime() - startDate.getTime() >= 0;
      }

      return true;
    };

    if (!isAcceptableTime()) {
      throw new BadRequestError('Ny slut- och starttid för aktivitet är omöjlig!');
    }

    if (activity.source !== PrismaActivitySource.WEBSITE) {
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

    const modifiedActivity = await prisma.prismaActivity.update({
      data: { ...update },
      where: { id },
    });
    return modifiedActivity;
  }

  async removeActivity(id: string): Promise<PrismaActivity> {
    const activity = await this.getActivity(id);
    if (activity.source !== PrismaActivitySource.WEBSITE) {
      throw new BadRequestError(
        'Ej tillåtet att ta bort evenemang som inte är skapade på hemsidan!',
      );
    }
    const removedActivity = await prisma.prismaActivity.delete({ where: { id } });

    return removedActivity;
  }

  async clear() {
    devGuard('Cannot clear activities in production');

    await prisma.prismaActivity.deleteMany();
  }
}
