import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { devGuard, stripObject } from '@/util';
import { ModifiedActivity, NewActivity, Utskott } from '@generated/graphql';
import { Prisma, PrismaActivity, PrismaActivitySource } from '@prisma/client';

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
      orderBy: { startDate: 'asc' },
    });

    return a;
  }

  async addActivity(activity: NewActivity): Promise<PrismaActivity> {
    if (activity.endDate && activity.endDate.getTime() - activity.startDate.getTime() < 0) {
      throw new BadRequestError('Sluttid för aktivitet är före starttid!');
    }

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
    const a = await this.getActivity(id);
    if (mod.endDate) {
      if (mod.startDate && mod.endDate.getTime() - mod.startDate.getTime() < 0) {
        throw new BadRequestError('Modifierad sluttid för aktivitet är före modifierad starttid!');
      } else if (!mod.startDate && mod.endDate.getTime() - a.startDate.getTime() < 0) {
        throw new BadRequestError('Modifierad sluttid för aktivitet är före starttiden!');
      }
    }
    if (a.source !== PrismaActivitySource.WEBSITE) {
      throw new BadRequestError(
        'Ej tillåtet att ändra i evenemang som inte är skapade på hemsidan!',
      );
    }

    const { location, ...reduced } = mod;

    const refact = {
      ...reduced,
      locationTitle: mod.location?.title,
      locationLink: mod.location?.link,
    };

    const update: StrictObject = stripObject(refact);

    const res = await prisma.prismaActivity.update({
      data: { ...update },
      where: { id },
    });
    return res;
  }

  async removeActivity(id: string): Promise<boolean> {
    const a = await this.getActivity(id);
    if (a.source !== PrismaActivitySource.WEBSITE) {
      throw new BadRequestError(
        'Ej tillåtet att ta bort evenemang som inte är skapade på hemsidan!',
      );
    }
    await prisma.prismaActivity.delete({ where: { id } });
    return true;
  }

  async clear() {
    devGuard('Cannot clear activities in production');

    await prisma.prismaActivity.deleteMany();
  }
}
