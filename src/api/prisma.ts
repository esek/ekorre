import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { PrismaClient } from '@prisma/client';

const logger = Logger.getLogger('prisma');

const prisma = new PrismaClient();

if (config.DEV) {
  // Logs how long a query takes to run (only in dev)
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
    return result;
  });
}

/* Prisma middleware that throws a requesterror if a query fails
  Also logs the error using the logger
*/
prisma.$use(async (params, next) => {
  try {
    const result = await next(params);
    return result;
  } catch (err) {
    logger.error(err);
    throw new ServerError('Ett databasfel inträffade');
  }
});

export default prisma;
