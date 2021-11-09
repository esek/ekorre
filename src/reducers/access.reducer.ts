import { DatabaseJoinedAccess } from '../api/access.api';
import { Access, ResourceType } from '../graphql.generated';

/**
 * Reduce database access arrays to an access object
 * @param dbAccess database access
 * @returns access object
 */
export const accessReducer = (dbAccess: DatabaseJoinedAccess[]): Access => {
  const initial: Access = {
    doors: [],
    web: [],
  };

  const access = dbAccess.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refname, refresource, ...resource } = curr;

    switch (resource.resourceType) {
      case ResourceType.Web:
        if (acc.web.some((web) => web.id === resource.id)) {
          break;
        }
        acc.web.push(resource);
        break;
      case ResourceType.Door:
        if (acc.doors.some((door) => door.id === resource.id)) {
          break;
        }
        acc.doors.push(resource);
        break;
      default:
        break;
    }

    return acc;
  }, initial);

  return access;
};
