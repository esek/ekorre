import { reduce } from '.';
import type { DatabaseAccess } from '@db/access';
import { Access, AccessResourceType, Door, DoorInfo, Feature, FeatureInfo } from '@generated/graphql';





/**
 * Reduce database access arrays to an access object
 * @param dbAccess database access
 * @returns access object
 */
export const accessReducer = (dbAccess: DatabaseAccess[]): Access => {
  const initial: Access = {
    doors: [],
    features: [],
  };

  const access = dbAccess.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resourcetype, resource } = curr;

    switch (resourcetype) {
      case AccessResourceType.Feature: {
        if (acc.features.includes(resource as Feature)) {
          break;
        }
        acc.features.push(resource as Feature);
        break;
      }
      case AccessResourceType.Door:
        if (acc.doors.includes(resource as Door)) {
          break;
        }
        acc.doors.push(resource as Door);
        break;
      default:
        break;
    }

    return acc;
  }, initial);

  return access;
};

const featureDescriptions: Record<string, string> = {
  [Feature.AccessAdmin]: 'För att kunna administrera access',
  [Feature.PostAdmin]: 'För att kunna administrera poster och dess medlemmar',
  [Feature.UserAdmin]: 'För att kunna administrera användare',
  [Feature.ElectionAdmin]: 'För att kunna administrera val',
  [Feature.HeheAdmin]: 'För att kunna administrera hehe',
  [Feature.NewsEditor]: 'För att kunna skriva nyheter',
  [Feature.ArticleEditor]: 'För att kunna skriva informationssidor',
  [Feature.Superadmin]: 'För att kunna administrera allt',
  [Feature.MeetingsAdmin]: 'För att kunna administrera möten',
};

export const featureReducer = (features: Feature[]): FeatureInfo[] => {
  const featureInfos: FeatureInfo[] = features.map((feature) => ({
    description: featureDescriptions[feature] ?? '',
    name: feature,
  }));

  return featureInfos;
};

const doorDescriptions: Record<string, string> = {
  [Door.Arkivet]: 'NollU:s svinstia',
  [Door.Bd]: 'Den blåa dörren i Edekvata',
  [Door.Biljard]: 'Skåpet i biljard',
  [Door.Cm]: 'Där all läsk finns',
  [Door.Ekea]: 'Där all skräp finns',
  [Door.Hk]: 'Hongkong',
  [Door.Km]: 'Källarmästeriets källare',
  [Door.Led]: 'Ledningskontoret',
  [Door.Pa]: 'Påsken',
  [Door.Pump]: 'Pumpen',
  [Door.Sikrit]: 'Sikritet',
  [Door.Ulla]: 'Ulla',
};

export const doorReducer = (doors: Door[]): DoorInfo[] => {
  const doorInfos: DoorInfo[] = doors.map((door) => ({
    description: doorDescriptions[door] ?? '',
    name: door,
  }));

  return doorInfos;
};