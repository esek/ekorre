import prisma from '@/api/prisma';
import { Router } from 'express';

import packageJson from '../../package.json';

const healthRoute = Router();

/**
 * Gets the health of the server along with the version
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
healthRoute.get('/', async (req, res) => {
  // Try to run a dummy query to see if db is up
  const dbOk = await prisma.$queryRaw`SELECT 1 + 1 AS result`.then(() => true).catch(() => false);

  return res.send({
    status: {
      API: 'OK',
      DB: dbOk ? 'OK' : 'DOWN',
    },
    referer: {
      ip: req.socket.remoteAddress,
      url: req.headers.referer,
    },
    version: packageJson.version,
    license: packageJson.license,
    repository: packageJson.repository,
  });
});

export default healthRoute;
