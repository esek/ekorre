import { ActivityResponse, Utskott } from '@generated/graphql';
import { PrismaEvent } from '@prisma/client';

export const activityReduce = (dbActivity: PrismaEvent): ActivityResponse => {
  const { utskott, title, description, imageURL, startDate, endDate, refKey, location } =
    dbActivity;
  return {
    id: refKey,
    utskott: utskott as Utskott,
    title: title,
    description: description,
    imageURL: imageURL,
    startDate: startDate,
    endDate: endDate,
    location: location,
  };
};
