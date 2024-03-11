import { AccessEntry } from '@/models/access';
import {
  Access,
  AccessResourceType,
  Door,
  DoorInfo,
  Feature,
  FeatureInfo,
} from '@generated/graphql';

/**
 * Reduce database access arrays to an access object
 * @param dbAccess database access
 * @returns access object
 */
export const accessReducer = (dbAccess: AccessEntry[]): Access => {
  const initial: Access = {
    doors: [],
    features: [],
  };

  const access = dbAccess.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resourceType, resource } = curr;

    switch (resourceType) {
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

const featureDescriptions: Record<Feature, string> = {
  [Feature.AccessAdmin]: 'För att kunna administrera access',
  [Feature.PostAdmin]: 'För att kunna administrera poster och dess medlemmar',
  [Feature.UserAdmin]: 'För att kunna administrera användare',
  [Feature.ElectionAdmin]: 'För att kunna administrera val',
  [Feature.HeheAdmin]: 'För att kunna administrera hehe',
  [Feature.NewsEditor]: 'För att kunna skriva nyheter',
  [Feature.ArticleEditor]: 'För att kunna skriva informationssidor',
  [Feature.Superadmin]: 'För att kunna administrera allt',
  [Feature.MeetingsAdmin]: 'För att kunna administrera möten',
  [Feature.FilesAdmin]: 'För att kunna administrera filer',
  [Feature.EmailAdmin]: 'För att kunna skicka mejl',
  [Feature.AhsAdmin]: 'För att kunna administrera AHS',
  [Feature.ActivityAdmin]: 'För att kunna administrera aktiviteter',
};

export const featureReducer = (features: Feature[]): FeatureInfo[] => {
  const featureInfos: FeatureInfo[] = features.map((feature) => ({
    description: featureDescriptions[feature] ?? '',
    name: feature,
  }));

  // Superadmin should be first
  const sorted = featureInfos.sort((a, b) =>
    a.name === Feature.Superadmin ? -1 : a.name.localeCompare(b.name),
  );

  return sorted;
};

const doorDescriptions: Record<Door, string> = {
  [Door.Arkivet]: 'NollU:s svinstia',
  [Door.Bd]: 'Den blåa dörren i Edekvata',
  [Door.Biljard]: 'Skåpet i biljard',
  [Door.Cm]: 'Där all läsk finns',
  [Door.Edekvata]: 'Idèt för E:are',
  [Door.Ekea]: 'Där all skräp finns',
  [Door.Hk]: 'Hongkong',
  [Door.Km]: 'Källarmästeriets källare',
  [Door.Led]: 'Ledningskontoret',
  [Door.Ledtoa]: 'Toalett för arbetare i LED',
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

  const sorted = doorInfos.sort((a, b) => a.name.localeCompare(b.name));

  return sorted;
};
