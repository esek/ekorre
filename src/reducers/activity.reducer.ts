import { Activity, ActivitySource, Utskott } from '@generated/graphql';
import { PrismaActivity } from '@prisma/client';

export const activityReducer = (dbActivity: PrismaActivity): Activity => {
  let location = undefined;
  if (dbActivity.locationTitle) {
    location = { title: dbActivity.locationTitle, link: dbActivity.locationLink };
  }
  return {
    id: dbActivity.id,
    source: dbActivity.source as ActivitySource,
    title: dbActivity.title,
    description: dbActivity.description,
    startDate: dbActivity.startDate,
    endDate: dbActivity.endDate,
    utskott: dbActivity.utskott as Utskott,
    imageUrl: dbActivity.imageUrl,
    location: location,
    hidden: dbActivity.hidden,
  };
};
