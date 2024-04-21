import prisma from '@/api/prisma';
import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { PrismaActivity, PrismaTicket } from '@prisma/client';
import axios from 'axios';

/*
  Creates an axios-instance and sets the baseUrl and authorization header
  to the corresponding values in the config
*/

const {
  ORBI: { URL, API_TOKEN },
} = config;

const api = axios.create({
  baseURL: URL,
  headers: { 'x-api-key': API_TOKEN },
});

type OrbiResponse = [
  {
    activity: PrismaActivity;
    tickets: [PrismaTicket];
    departmentName: string;
  },
];

let latestCall = 0;

export const updateOrbiActivities = async () => {
  const timestamp = Date.now();
  //If latest call was < 10 minutes ago
  if (timestamp - latestCall < 600000) {
    return;
  }
  try {
    const res = await api.get<OrbiResponse>('/activities', { params: { timestamp } });

    const promises = res.data.map(async (item) => {
      const act = item.activity;

      //Since the API only returns numbers for dates
      act.startDate = new Date(act.startDate);
      if (act.endDate) {
        act.endDate = new Date(act.endDate);
      }

      await prisma.prismaActivity.upsert({
        where: { id: act.id },
        update: act,
        create: act,
      });
    });

    await Promise.all(promises);
  } catch {
    throw new ServerError('Det gick inte att updatera aktiviteter från Orbi');
  }
  latestCall = timestamp;
};
