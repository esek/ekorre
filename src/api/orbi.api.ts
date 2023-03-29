import config from '@/config';
import { Utskott } from '@generated/graphql';
import { Axios } from 'axios';

const axios = new Axios({
  headers: {
    accept: 'application/json',
    'x-api-key': config.ORBI.KEY,
  },
});
const activitiesEndpoint = 'https://apis.orbiapp.io/v1/departments/activities';
const OrgNodeEndpoint = 'https://apis.orbiapp.io/v1/departments/org-nodes/tree';

export type OrbiActivityResponse = [OrbiActivityData];

export type OrbiActivityData = {
  activityKey: string;
  departmentKey: Utskott;
  title: string;
  description: string;
  shortlivedCoverImageUrl: string;
  startDate: number;
  endDate: number;
  location: {
    label: string;
    description: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    link: string;
  };
  ticketData: [
    {
      ticketTypeKey: string;
      ticketTypeName: string;
      totalTicketCount: number;
      price: number;
      currency: string;
    },
  ];
};

export type OrbiOrgTreeResponse = [OrbiOrgTreeData];

export type OrbiOrgTreeData = {
  orgNodeKey: string;
  name: string;
  type: string;
  parentKey: string;
  departments: [OrbiDepartment];
};

export type OrbiDepartment = {
  departmentKey: Utskott;
  name: string;
  about: string;
  orgNodeKey: string;
  shortlivedLogoUrl: string;
  social: {
    facebookUrl: string;
    instagramUrl: string;
    twitterUrl: string;
    websiteUrl: string;
    youtubeUrl: string;
  };
};

export type ActivityList = {
  aEvents: Map<string, OrbiActivityData>;
  tEvents: Map<number, Set<string>>;
  timestamp: number;
};

export type OrgTree = {
  node: OrbiOrgTreeData;
  timestamp: number;
};

const latestActivityResponse: ActivityList = {
  aEvents: new Map<string, OrbiActivityData>(), //
  tEvents: new Map<number, Set<string>>(),
  timestamp: 0,
};
const latestOrganizationTree: OrgTree = {
  node: {
    orgNodeKey: '',
    name: '',
    type: '',
    parentKey: '',
    departments: [
      {
        departmentKey: Utskott.Other,
        name: '',
        about: '',
        orgNodeKey: '',
        shortlivedLogoUrl: '',
        social: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          websiteUrl: '',
          youtubeUrl: '',
        },
      },
    ],
  },
  timestamp: 0,
};

//

const departmentKeytoTagMap: Map<string, Utskott> = new Map<string, Utskott>();

//(minimum) number of milliseconds between each call to the orbi API
const activityFetchCycle: number = 20 * 60 * 1000; //20 minutes
const orgTreeFetchCycle: number = 60 * 60 * 1000; //1 hour

export class OrbiAPI {
  private getDepartmentFromKey(departmentKey: string): Utskott {
    const dep = departmentKeytoTagMap.get(departmentKey);
    return dep ? dep : Utskott.Other;
  }

  /**
   * Retrieves all scheduled activites on Orbi
   * from the year, month and departments (in that month)
   * specified. If no department is specified, activities
   * from all departments (in that month) will be returned.
   */
  async getActivities(
    year: number,
    month: number,
    departments: Utskott[],
  ): Promise<OrbiActivityData[]> {
    await this.updateActivities();
    //In reality we do not need to await...
    //No one would be the unfortunate
    //bastard who needs to wait the extra
    //second for the page to load that
    //one time every 20 minutes.
    const tSet = latestActivityResponse.tEvents.get(year * 12 + month);
    const send: OrbiActivityData[] = [];
    tSet?.forEach((value) => {
      const activity = latestActivityResponse.aEvents.get(value);
      if (activity && departments.includes(activity.departmentKey)) {
        send.push(activity);
      }
    });
    return send;
  }

  /**
   * Updates the activity list with all events ranging from last month
   * to three months forward by calling the Orbi API directly. These
   * are added to the local activity list and also updates existing events.
   * WARNING: Slow. You see that sloth over there? Speedy Gonzales compared to this.
   */
  private async updateActivities() {
    if (Date.now() - latestActivityResponse.timestamp < activityFetchCycle) return;
    latestActivityResponse.timestamp = Date.now();

    const f = async function (n: number) {
      const res = await axios.get(activitiesEndpoint, {
        params: {
          from: new Date().setMonth(new Date().getMonth() + n),
          interval: 'month',
        },
      });
      if (res.status !== 200) {
        //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
        throw new Error(`${res.status} ${res.statusText} ${String(res.data)}`);
      }
      return JSON.parse(String(res.data)) as OrbiActivityResponse;
    };

    const data = Promise.all([f(-1), f(0), f(1), f(2)]);
    const flattened = (await data).flat(1);
    flattened.forEach((value) => {
      //Add and update activities in the cache
      //Hashed between activity key and event data
      value.departmentKey = this.getDepartmentFromKey(value.departmentKey);
      latestActivityResponse.aEvents.set(value.activityKey, value);

      //Add and update activity keys hashed on
      //month (and year) of the activity dates.
      const dateRef = (n: number) => {
        const date = new Date(n);
        const dateHash = date.getFullYear() * 12 + date.getMonth();
        const dateSet = latestActivityResponse.tEvents.get(dateHash);
        latestActivityResponse.tEvents.set(
          dateHash,
          dateSet ? dateSet.add(value.activityKey) : new Set(value.activityKey),
        );
      };
      //Once for startDate and once for endDate
      //in case they are in different months
      dateRef(value.startDate);
      dateRef(value.endDate);
    });
  }

  async getDepartmentInfo(departments: Utskott[]): Promise<OrbiDepartment[]> {
    const orgTree = await this.getOrganizationNodeTree();
    return orgTree.departments.filter((d) => departments.includes(d.departmentKey));
  }
  /**
   * Retrieves the guild's organization tree from Orbi. Contains
   * descriptions of each utskott (department) and links to each
   * department's social medias.
   */
  async getOrganizationNodeTree(): Promise<OrbiOrgTreeData> {
    await this.updateOrganizationNodeTree();
    return latestOrganizationTree.node;
  }

  /**
   * updates the orgTree by call to Orbi directly. WARNING: Slow. Real slow.
   */
  private async updateOrganizationNodeTree() {
    if (Date.now() - latestOrganizationTree.timestamp < orgTreeFetchCycle) return;
    latestOrganizationTree.timestamp = Date.now();

    const res = await axios.get(OrgNodeEndpoint);
    if (res.status !== 200) {
      //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
      throw new Error(`${res.status} ${res.statusText} ${String(res.data)}`);
    }
    //Note: OrgTree is recieved as an array of only 1 element containing E-sektionen (LTH)
    //and all departments within key: "departments". Possibly multiple OrgTrees can exist
    //in this structure. We only choose the first because no more elements exist currently.
    //This might need revision should the guild rework its Orbi workspace.
    latestOrganizationTree.node = (JSON.parse(String(res.data)) as [OrbiOrgTreeData])[0];
    latestOrganizationTree.node.departments.forEach((value) => {
      //Translating between the department name on orbi
      //and the enum Utskott is pretty nasty and not at
      //all robust. DO NOT mess with the name property
      //of departments on Orbi. I do not believe it can be
      //done dynamically so do not change them!
      const ref = value.name.toUpperCase().replace('Ö', 'O') as Utskott;
      const tag = Object.values(Utskott).includes(ref) ? ref : Utskott.Other;
      departmentKeytoTagMap.set(value.departmentKey, tag);
      value.departmentKey = tag;
    });
  }
}
