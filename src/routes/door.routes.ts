import { Router } from 'express';

import AccessResourcesAPI from '../api/accessresources.api';
import { AccessResourceType } from '../graphql.generated';

const doorsRoute = Router();
const resourcesAPI = new AccessResourcesAPI();

// TODO: Does this need the usernames as well for every user?
// eslint-disable-next-line @typescript-eslint/no-misused-promises
doorsRoute.get('/', async (_req, res) => {
  try {
    const doors = await resourcesAPI.getResources(AccessResourceType.Door);

    return res.send({
      status: 'success',
      data: doors.map((d) => ({ name: d.name, slug: d.slug })),
    });
  } catch {
    return res.send({
      status: 'error',
      error: {
        message: 'Could not fetch doors',
        contactEmail: 'macapar@esek.se',
      },
    });
  }
});

export default doorsRoute;
