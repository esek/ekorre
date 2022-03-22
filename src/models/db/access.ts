export type DatabaseAccess = {
  refname: string;
  resourcetype: AccessResourceType;
  resource: string;
};

export enum AccessResourceType {
  Feature = 'web',
  Door = 'door'
}
