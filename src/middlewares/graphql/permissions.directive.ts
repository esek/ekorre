import { useDirective } from '.';

import { AccessAPI } from '../../api/access.api';
import { ForbiddenError, UnauthenticatedError } from '../../errors/RequestErrors';
import { accessReducer } from '../../reducers/access.reducer';

const accessAPI = new AccessAPI();

const SUPER_ADMIN = 'super-admin';

type Args = {
  roles: string[];
};

export const permissionsDirectiveTransformer = useDirective<Args>(
  'withPermissions',
  async ({ getUsername }, resolve, { roles }) => {
    const username = getUsername();

    // No username = no user = no access
    if (!username) {
      throw new UnauthenticatedError('Du måste logga in för att se denna resursen');
    }

    // Get the users full access
    const access = await accessAPI.getUserFullAccess(username);
    const { web } = accessReducer(access);

    // Map it so it's only the slugs
    const slugs = web.map((w) => w.slug);

    // Check that the slugs contains at least of the needed roles
    // OR that the user is a super admin
    if (!roles.some((r) => slugs.includes(r)) && !slugs.includes(SUPER_ADMIN)) {
      throw new ForbiddenError(
        `Du måste ha någon av rollerna: [${roles.join(',')}] för att komma åt denna resursen`,
      );
    }

    return resolve();
  },
);
