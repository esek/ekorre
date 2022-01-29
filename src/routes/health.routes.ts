import db from '@/api/knex';
import { Router } from 'express';
import packageJson from 'package.json';

const healthRoute = Router();

/**
 * Gets the health of the server along with the version
 */
healthRoute.get('/', async (req, res) => {
  // Try to run a dummy query to see if db is up
  const dbOk = await db
    .raw('select 1 + 1 as result')
    .then(() => true)
    .catch(() => false);

  res.send({
    status: {
      API: 'OK',
      DB: dbOk ? 'OK' : 'DOWN',
    },
    referer: {
      ip: req.socket.remoteAddress,
      url: req.headers.referer,
    },
    version: packageJson.version,
  });
});

export default healthRoute;
