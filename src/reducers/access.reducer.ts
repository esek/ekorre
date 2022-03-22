import { AccessResourceType, DatabaseAccess } from '@db/access';
import { Access, Door, Feature } from '@generated/graphql';

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
    const { refname, resourcetype, resource } = curr;

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
