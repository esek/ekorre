import { PrismaUtskott, PrismaPostType, Prisma } from '@prisma/client';

export const events: Prisma.PrismaEventCreateInput[] = [
  {
    title: "bob",
    description: "This is very descript",
    startDate: "Söndag",
    endDate: "senare på söndag",
  },
  {
    title: "Sporta meed E",
    description: "Vi gör inget intressant, almänt tråkigt smh...",
    startDate: new Date(),
    endDate: new Date(),
  },
];

