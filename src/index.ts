import { app } from '@/app/app';
import { ActivityAPI } from '@api/activity';
import config from '@/config';
import { Logger } from '@/logger';
import { startInterviewSummaryScheduler } from '@service/interview-summary';
import TeknologappenService from '@service/teknologappen';

const { PORT, HOST } = config;
const teknologappen = new TeknologappenService();
const activityApi = new ActivityAPI();

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

let syncInProgress = false;

const syncTeknologappenActivities = async () => {
  if (syncInProgress) {
    logger.warn('Skipping Teknologappen synchronization because another sync is in progress');
    return;
  }

  syncInProgress = true;
  try {
    const activities = await teknologappen.getActivities();
    const synced = await activityApi.syncTeknologappenActivities(activities);
    logger.log(`Synced ${synced} activities from Teknologappen`);
  } catch (error: unknown) {
    logger.error(`Teknologappen synchronization failed: ${String(error)}`);
  } finally {
    syncInProgress = false;
  }
};

logger.log('Beginning startup...');

app.listen(PORT, HOST, () => {
  logger.log(`Server started on http://${HOST}:${PORT}`);
  startInterviewSummaryScheduler();

  void syncTeknologappenActivities();

  if (config.TEKNOLOGAPPEN.SYNC_INTERVAL_MINUTES > 0) {
    setInterval(
      () => void syncTeknologappenActivities(),
      config.TEKNOLOGAPPEN.SYNC_INTERVAL_MINUTES * 60 * 1000,
    );
  }
});
