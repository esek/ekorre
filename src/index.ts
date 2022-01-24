import { app } from './app/app';
import config from './config';
import { Logger } from './logger';

const { PORT, HOST } = config;

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

logger.log('Beginning startup...');

app.listen(PORT, HOST, () => {
  logger.log(`Server started on http://${HOST}:${PORT}`);
});
