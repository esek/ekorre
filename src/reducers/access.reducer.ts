import { DatabaseIndividualJoinedAccess, DatabasePostJoinedAccess } from '@api/access';
import { Access as GqlAccess, AccessResource, AccessResourceType } from '@generated/graphql';

/**
 * Reduce database access arrays to an access object
 * @param dbAccess database access
 * @returns access object
 */
export const accessReducer = (
  dbAccess: (DatabaseIndividualJoinedAccess | DatabasePostJoinedAccess)[],
): GqlAccess => {
  const initial: GqlAccess = {
    doors: [],
    web: [],
  };

  const access = dbAccess.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resource } = curr;

    switch (resource.resourceType) {
      case AccessResourceType.Web:
        if (acc.web.some((web) => web.slug === resource.slug)) {
          break;
        }
        acc.web.push(resource as AccessResource);
        break;
      case AccessResourceType.Door:
        if (acc.doors.some((door) => door.slug === resource.slug)) {
          break;
        }
        acc.doors.push(resource as AccessResource);
        break;
      default:
        break;
    }

    return acc;
  }, initial);

  return access;
};
