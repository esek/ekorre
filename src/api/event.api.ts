/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { PrismaExtendedArticle } from '@/models/prisma';
import { parseSlug, stripObject, toUTC } from '@/util';
import { ArticleType, ModifyArticle, NewArticle } from '@generated/graphql';
import { Event, NewEvent } from "@generated/graphql"
import { Prisma, PrismaArticleType, PrismaEvent } from '@prisma/client';

import prisma from './prisma';

const defaultOrder: Prisma.PrismaEventOrderByWithRelationAndSearchRelevanceInput[] = [
  {
    startDate: 'desc',
  },
  {
    title: 'asc',
  },
];



export class EventAPI {
  async getAllEvents(): Promise<PrismaEvent[]> {
    const a = await prisma.prismaEvent.findMany({
      orderBy: defaultOrder,
    })
    return a
  }

  async createEvent({
      title,
      description,
      startDate,
      endDate,
  }: NewEvent): Promise<PrismaEvent> {
      const created = await prisma.prismaEvent.create({
        data: {
          title,
          description,
          startDate,
          endDate,
        }
      });
      return created!;
  }
}



