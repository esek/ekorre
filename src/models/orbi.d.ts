import { Utskott } from '@generated/graphql';

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
