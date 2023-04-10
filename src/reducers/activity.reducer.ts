import { ActivityResponse, Utskott } from '@generated/graphql';
import { PrismaActivity } from '@prisma/client';

export const activityReduce = (dbActivity: PrismaActivity): ActivityResponse => {
  const { utskott, title, description, imageURL, startDate, endDate, id, location } = dbActivity;
  return {
    id: id,
    utskott: utskott as Utskott,
    title: title,
    description: description,
    imageURL: imageURL,
    startDate: startDate,
    endDate: endDate,
    location: location,
  };
};
