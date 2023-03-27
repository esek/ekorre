import { Event } from '@generated/graphql';
import { PrismaEvent } from '@prisma/client';

export function eventReducer(event: PrismaEvent): Event {
  const {id, startDate, endDate, title, description} = event
  let out = {
    id: id,
    startDate: startDate,
    endDate: endDate,
    title: title,
    description: description
  } as Event
  return out
}
