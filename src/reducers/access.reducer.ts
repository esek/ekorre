import { AccessEntry, AccessEndDateEntry } from '@/models/access';
import { AccessLogIndividualAccessResponse, AccessLogPostResponse } from '@/models/mappers';
import {
  Access,
  AccessEndDate,
  AccessResourceType,
  Door,
  DoorEndDate,
  DoorInfo,
  Feature,
  FeatureEndDate,
  FeatureInfo,
} from '@generated/graphql';
import { PrismaIndividualAccessLog, PrismaPostAccessLog } from '@prisma/client';

export const accessLogPostReducer = (access: PrismaPostAccessLog): AccessLogPostResponse => {
  const { id, refGrantor, refTarget, resourceType, ...reduced } = access;
  return {
    ...reduced,
    resourceType: resourceType as AccessResourceType,
    grantor: { username: refGrantor },
    target: { id: refTarget },
  };
};

export const accessLogIndividualAccessReducer = (
  access: PrismaIndividualAccessLog,
): AccessLogIndividualAccessResponse => {
  const { id, refGrantor, refTarget, resourceType, ...reduced } = access;
  return {
    ...reduced,
    resourceType: resourceType as AccessResourceType,
    grantor: { username: refGrantor },
    target: { username: refTarget },
  };
};

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
      case AccessResourceType.Door: {
        if (acc.doors.includes(resource as Door)) {
          break;
        }
        acc.doors.push(resource as Door);
        break;
      }
      default:
        break;
    }

    return acc;
  }, initial);

  return access;
};

/**
 * Reduce database access arrays to an accessEndDate object
 * @param dbAccess database access
 * @returns accessEndDate object
 */
export const accessEndDateReducer = (dbAccess: AccessEndDateEntry[]): AccessEndDate => {
  const initial: AccessEndDate = {
    doorEndDates: [],
    featureEndDates: [],
  };

  const access = dbAccess.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resourceType, resource, endDate } = curr;

    switch (resourceType) {
      case AccessResourceType.Feature: {
        const feature = resource as Feature;
        if (acc.featureEndDates.some((featureEndDate) => featureEndDate.resource === feature)) {
          break;
        }
        acc.featureEndDates.push({ resource: feature, endDate } as FeatureEndDate);
        break;
      }
      case AccessResourceType.Door: {
        const door = resource as Door;
        if (acc.doorEndDates.some((doorEndDates) => doorEndDates.resource === door)) {
          break;
        }
        acc.doorEndDates.push({ resource: door, endDate } as DoorEndDate);
        break;
      }
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
  [Feature.DecibelAdmin]: 'För att kunna gå in på decibel',
  [Feature.Booker]: 'För att kunna boka på bokaboka',
  [Feature.BookingAdmin]: 'För att kunna administrera bokningar på bokaboka',
  [Feature.EmmechAdmin]: 'För att kunna administera bilder på emmech',
  [Feature.BalAdmin]: 'För att kunna administrera bal på admin.esek.se',
  [Feature.ExpoAdmin]: 'För att kunna administrera expo på admin.esek.se',
  [Feature.SalmonellaAdmin]: 'För att kunna administrera Salmonella på admin.esek.se',
  [Feature.AccountingAdmin]: 'Admin på kvitto.esek.se (ej Fortnox)',
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
