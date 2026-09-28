/**
 * Daily summary to the election committee of nominees who found no interview time.
 * Sent at 17:15 Stockholm time, only when something happened since the last one.
 *
 * Each summary is claimed in the database before it is sent, so a restart, a catch-up
 * after downtime or several running instances never send the same summary twice.
 */
import { Logger } from '@/logger';
import { InterviewAPI } from '@api/interview';
import { UserAPI } from '@api/user';
import { sendCommitteeMail } from '@service/interview-mail';
import { latestSummaryTime, nextSummaryTime } from '@service/interview-rules';

const logger = Logger.getLogger('InterviewSummary');
const api = new InterviewAPI();
const userApi = new UserAPI();

/**
 * Sends the summaries due at the latest 17:15 before `now`. Returns how many were sent.
 */
export const runDailySummaries = async (now = new Date()) => {
  const summaryTime = latestSummaryTime(now);
  const electionIds = await api.getElectionsWithPendingSummary(summaryTime);
  let sent = 0;

  for (const electionId of electionIds) {
    const claim = await api.claimDailySummary(electionId, summaryTime);
    if (!claim || claim.events.length === 0) continue;

    // One line per nominee, with the longest length they needed
    const needed = new Map<string, number>();
    for (const e of claim.events) {
      needed.set(e.refUser, Math.max(needed.get(e.refUser) ?? 0, e.requiredMinutes));
    }
    const users = await userApi.getMultipleUsers([...needed.keys()]);
    const names = new Map(users.map((u) => [u.username, `${u.firstName} ${u.lastName}`]));

    const view = await api.getMissingView(electionId, now);
    const lines = [
      `${needed.size} nominerade hittade ingen intervjutid som passade sedan förra sammanfattningen:`,
      ...[...needed.entries()].map(
        ([username, minutes]) => `${names.get(username) ?? username} (${username}), ${minutes} min`,
      ),
      `Just nu saknar ${view.unbooked.length} nominerade bokning. De behöver totalt ${view.minutesNeeded} min, och det finns ${view.minutesAvailable} min lediga.`,
    ];

    const ok = await sendCommitteeMail(
      claim.settings.notifyEmails,
      'Nominerade saknar intervjutid',
      'Nominerade saknar intervjutid',
      lines,
      electionId,
    );
    if (ok) sent += 1;
  }
  return sent;
};

let timer: NodeJS.Timeout | null = null;

const safeRun = async () => {
  try {
    const sent = await runDailySummaries();
    if (sent) logger.log(`Sent ${sent} interview summaries`);
  } catch (err) {
    logger.error('Interview summary failed');
    logger.error(err);
  }
};

const scheduleNext = () => {
  const delay = nextSummaryTime(new Date()).getTime() - Date.now();
  timer = setTimeout(() => {
    void safeRun().finally(scheduleNext);
  }, delay);
  timer.unref();
};

/** Catches up on a missed summary, then runs every day at 17:15 Stockholm time */
export const startInterviewSummaryScheduler = () => {
  if (timer) return;
  void safeRun().finally(scheduleNext);
};

export const stopInterviewSummaryScheduler = () => {
  if (timer) clearTimeout(timer);
  timer = null;
};
