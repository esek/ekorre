import { Logger } from '@/logger';
import config from '@/config';
import { Axios, AxiosResponse } from 'axios';
import { Utskott, UtskottInfo } from '@generated/graphql';

const logger = Logger.getLogger('OrbiAPI');
const axios = new Axios({
  headers: {
    'accept': 'application/json',
    'x-api-key': config.ORBI.KEY
  }});
const UrlActivities = 'https://apis.orbiapp.io/v1/departments/activities';
const UrlOrgNodes = 'https://apis.orbiapp.io/v1/departments/org-nodes/tree';

export type OrbiActivityResponse = [OrbiActivityData];

export type OrbiActivityData = {
  activityKey: string,
  departmentKey: string,
  title: string,
  description: string,
  shortlivedCoverImageUrl: string,
  startDate: number,
  endDate: number,
  location: {
    label: string,
    description: string,
    coordinates: {
      latitude: number,
      longitude: number
    },
    link: string
  },
  ticketData: [
    {
      ticketTypeKey: string,
      ticketTypeName: string,
      totalTicketCount: number,
      price: number,
      currency: string
    }
  ]
};

export type OrbiOrgTreeResponse = [OrbiOrgTreeData];

export type OrbiOrgTreeData = {
  orgNodeKey: string,
  name: string,
  type: string,
  parentKey: string,
  departments: [OrbiDepartment]
};

export type OrbiDepartment = {
  departmentKey: string,
  name: string,
  about: string,
  orgNodeKey: string,
  shortlivedLogoUrl: string,
  social: {
    facebookUrl: string,
    instagramUrl: string,
    twitterUrl: string,
    websiteUrl: string,
    youtubeUrl: string
  }
}

export type ActivityList = {
  events: Map<string, OrbiActivityData>,
  timestamp: number
};

export type OrgTree = {
  node: OrbiOrgTreeData,
  timestamp: number
};

const latestActivityResponse : ActivityList = {events: new Map<string, OrbiActivityData>(), timestamp: 0};
const latestOrganizationTree : OrgTree = {
  node: {
    orgNodeKey: '',
    name: '',
    type: '',
    parentKey: '',
    departments: [
      {
        departmentKey: '',
        name: '',
        about: '',
        orgNodeKey: '',
        shortlivedLogoUrl: '',
        social: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          websiteUrl: '',
          youtubeUrl: ''
        }
      }
    ]
  }, timestamp: 0}; 

const departmentTagKeyMap : Map<Utskott, string> = new Map<Utskott, string>(); 

const activityFetchCycle : number = 20 * 60 * 1000; //number of milliseconds between each call to the orbi API 
const orgTreeFetchCycle : number = 60 * 60 * 1000; //number of milliseconds between each call to the orbi API 

export class OrbiAPI{
  constructor(){
    latestActivityResponse.timestamp = 0;//Date.now();
    latestOrganizationTree.timestamp = 0;//Date.now();
    this.updateActivities();
    this.updateOrganizationNodeTree();
  }
    /**
    * Retrieves all scheduled activites from Orbi.
    */
    async getActivities() : Promise<OrbiActivityData[]> {
      if(Date.now() - latestActivityResponse.timestamp >= activityFetchCycle){
        latestActivityResponse.timestamp = Date.now();
        await this.updateActivities();
        //in reality it might just be faster to not await...
        //Idk, terrified of race conditions I suppose.
      }
      return Array.from(latestActivityResponse.events.values());
    }

    /**
    * Updates the activity list with all events ranging from last month 
    * to three months forward by calling the Orbi API directly. These
    * are added to the local activity list and also updates existing events.
    * WARNING: Slow. That sloth over there? Speedy Gonzales compared to this. 
    */
    private async updateActivities() {
      const f = async function(n: number){
        const res = await axios.get(UrlActivities, {
          params: {
            'from': new Date().setMonth((new Date()).getMonth() + n), 
            'interval': 'month'
          }});
          if(res.status !== 200){
            //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
            throw new Error(res.status + ' ' + res.statusText + ' ' + res.data);
          }
          return JSON.parse(res.data) as OrbiActivityResponse; 
      }   

      const data = Promise.all([f(-1), f(0), f(1), f(2)]);
      const flattened = ((await data).flat(1));
      flattened.forEach((value) =>latestActivityResponse.events.set(value.activityKey, value));
    }

    async getDepartmentInfo(department : Utskott) : Promise<OrbiDepartment> {
      const orgTree = await this.getOrganizationNodeTree();
      const key = departmentTagKeyMap.get(department);
      const found = orgTree.departments.find(item => item.departmentKey === key);
      return found as OrbiDepartment;
    }
    /**
    * Retrieves the guild's organization tree from Orbi. Contains 
    * descriptions of each utskott (department) and links to each department's 
    * social medias. Also contains department keys to associate activities with the 
    * corresponding department.  
    */
    async getOrganizationNodeTree() : Promise<OrbiOrgTreeData>{
      if(Date.now() - latestOrganizationTree.timestamp > orgTreeFetchCycle){
        latestOrganizationTree.timestamp = Date.now();
        await this.updateOrganizationNodeTree();
      }
      return latestOrganizationTree.node;
    }

    /**
     * updates the orgTree by call to Orbi directly. WARNING: Slow. Real slow.
     */
    private async updateOrganizationNodeTree() {
      const f = await axios.get(UrlOrgNodes);
      if(f.status !== 200){
        //Kolla med pros om det går att dynamiskt kasta rätt errortyp baserat på f.status
        throw new Error(f.status + ' ' + f.statusText + ' ' + f.data);
      }
      //Note: OrgTree is recieved as an array of only 1 element containing E-sektionen (LTH)
      //and all departments within key: "departments". Possibly multiple OrgTrees can exist
      //in this structure. We only choose the first because no more elements exist currently.
      //This might need revision should the guild rework its Orbi workspace.
      latestOrganizationTree.node = JSON.parse(f.data)[0] as OrbiOrgTreeData;
      latestOrganizationTree.node.departments.forEach((value) => {
        //Translating between the department name on orbi
        //and the enum Utskott is pretty nasty and not at 
        //all robust. DO NOT mess with the name property
        //of departments on Orbi. I do not believe it can be 
        //done dynamically so do not change them!
        const ref = value.name.toUpperCase().replace('Ö','O');
        const tag = ref as Utskott;
        if(ref === 'E-sektionen'){tag === 'OTHER'}
        if(tag !== undefined){
          departmentTagKeyMap.set(tag, value.departmentKey);
        }
      });
    }
}