import config from '@/config';
import { OrbiActivityResponse, OrbiOrgTreeResponse } from '@/models/orbi';
import { Utskott } from '@generated/graphql';
import { Prisma, PrismaActivity } from '@prisma/client';
import { Axios } from 'axios';

import prisma from './prisma';

const axios = new Axios({
  headers: {
    accept: 'application/json',
    'x-api-key': config.ORBI.KEY,
  },
});

const defaultOrder: Prisma.PrismaActivityOrderByWithRelationAndSearchRelevanceInput[] = [
  { startDate: 'desc' },
  { title: 'asc' },
];

//Time (in milliseconds) since last call to the orbi API
let lastFetch: number;

//(minimum) number of milliseconds between each call to the orbi API
const fetchCycle: number = 20 * 60 * 1000; //20 minutes

const activitiesEndpoint = 'https://apis.orbiapp.io/v1/departments/activities';
const OrgNodeEndpoint = 'https://apis.orbiapp.io/v1/departments/org-nodes/tree';

export class OrbiAPI {
  constructor() {
    lastFetch = Date.now() - fetchCycle;
  }

  /**
   * Get activities from Orbi between the dates of **from** and **to**
   * that the specified utskott have published. This is similar to
   * calling updateActivities() and querying prismaEvent.findMany(),
   * filtering on **startDate** between **from** and **to**, utskott
   * in **utskott** and fromOrbi set to true.
   * @param from activities start date lower bound
   * @param to activities start date upper bound
   * @param utskott the departments to query. If null, queries all departments
   * @returns orbi activity data from the queried departments
   */
  async getActivities(from: Date, to: Date, utskott: Utskott[]): Promise<PrismaActivity[]> {
    await this.updateActivities();
    if (!utskott) utskott = Object.values(Utskott);
    const a = await prisma.prismaActivity.findMany({
      where: {
        startDate: {
          gte: from,
          lte: to,
        },
        utskott: { in: utskott },
        fromOrbi: true,
      },
      orderBy: defaultOrder,
    });
    return a;
  }

  /**
   * Retrieves activity data from orbi for the
   * coming three months, adding them to PrismaActivity
   * with fromOrbi = true
   */
  async updateActivities() {
    if (Date.now() - lastFetch < fetchCycle) return;
    const map = await this.getDepartmentKeyTagMap();
    const oldTimestamp = lastFetch;
    lastFetch = Date.now();

    const dateLastCall = new Date(oldTimestamp);
    const callTimes = [0, 1, 2].map((offset) =>
      new Date(oldTimestamp).setMonth(dateLastCall.getMonth() + offset),
    );

    //the api call to orbi with error handling
    const getOrbiActs = async function (n: number) {
      const res = await axios.get(activitiesEndpoint, {
        params: {
          from: n,
          interval: 'month',
        },
      });
      if (res.status !== 200) {
        //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
        throw new Error(`${res.status} ${res.statusText} ${String(res.data)}`);
      }
      return JSON.parse(String(res.data)) as OrbiActivityResponse;
    };
    const activities = (await Promise.all(callTimes.map((time) => getOrbiActs(time)))).flat(1);

    //To update the list of Orbi based events:
    //delete all future Orbi events currently in DB...
    await prisma.prismaActivity.deleteMany({
      where: {
        startDate: {
          //Note: only future events (events scheduled
          //after the last orbi API call) are deleted
          //as only future events are being queried anew
          gte: new Date(oldTimestamp),
        },
        fromOrbi: true,
      },
    });

    if (activities.length == 0) return;

    //... and create all the new Orbi events in DB
    await prisma.prismaActivity.createMany({
      data: activities.map((a) => {
        return {
          startDate: new Date(a.startDate),
          endDate: new Date(a.endDate),
          title: a.title,
          description: a.description,
          fromOrbi: true,
          utskott: map.get(a.departmentKey.toString()),
          id: a.activityKey,
          location: a.location.label,
        };
      }),
    });

    //This is done instead of updateMany as to delete
    //activities that have been removed from orbi.
  }

  /**
   * Retrieves department data from orbi,
   * adding them to PrismaDepartmentInfo
   */
  async getDepartmentKeyTagMap(): Promise<Map<string, Utskott>> {
    const res = await axios.get(OrgNodeEndpoint);
    if (res.status !== 200) {
      //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
      throw new Error(`${res.status} ${res.statusText} ${String(res.data)}`);
    }
    //Note: OrgTree is recieved as an array of only 1 element containing E-sektionen (LTH)
    //and all departments within key: "departments". Possibly multiple OrgTrees can exist
    //in this structure. We only choose the first because no more elements exist currently.
    //This might need revision should the guild rework its Orbi workspace.
    const node = (JSON.parse(String(res.data)) as OrbiOrgTreeResponse)[0];

    const departmentKeytoTagMap: Map<string, Utskott> = new Map<string, Utskott>();
    //Update departmentKey to tag (Utskott enum) map.
    node.departments.forEach((value) => {
      //Works for now. If utskott are reworked, this will have to change
      const ref = value.name.toUpperCase().replace('Ö', 'O') as Utskott;
      const tag = Object.values(Utskott).includes(ref) ? ref : Utskott.Other;
      departmentKeytoTagMap.set(value.departmentKey, tag);
      value.departmentKey = tag;
    });

    return departmentKeytoTagMap;
  }
}
