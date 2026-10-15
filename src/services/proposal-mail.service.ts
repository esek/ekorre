/**
 * Mail for valberedningens förslag and motkandidering. Every mail links to the person's
 * nominations for the election, where they answer.
 *
 * Sending never throws: the database is the source of truth, so a mail failure is logged
 * and the change stands.
 */
import config from '@/config';
import { Logger } from '@/logger';
import { sendEmail } from '@service/email';

const logger = Logger.getLogger('ProposalMail');

export const PROPOSAL_TEMPLATE = 'election-proposal';
/** Heading, lines and a button; shared with the interview summary */
export const COMMITTEE_TEMPLATE = 'interview-committee';

export type MailRecipient = {
  firstName: string;
  email: string;
};

const nominationsLink = (electionId: number) =>
  `${config.WEBSITE_URL}/member/election/mine/${electionId}`;

const deadlineFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/** e.g. "söndag 1 november kl. 23:59" in Stockholm time */
export const formatDeadline = (deadline: Date) => deadlineFormat.format(deadline);

const send = async (
  to: MailRecipient,
  subject: string,
  overrides: Record<string, string | string[]>,
) => {
  try {
    await sendEmail(to.email, subject, PROPOSAL_TEMPLATE, {
      firstName: to.firstName,
      ...overrides,
    });
    return true;
  } catch (err) {
    logger.error(`Failed to send "${subject}" to ${to.email}`);
    logger.error(err);
    return false;
  }
};

export const sendProposedMail = (
  electionId: number,
  to: MailRecipient,
  postname: string,
  deadline: Date,
) =>
  send(to, `Valberedningen föreslår dig till ${postname}`, {
    heading: 'Valberedningen föreslår dig',
    intro: 'Valberedningen vill föreslå dig till posten nedan. Svara om du vill bli föreslagen.',
    postsLabel: 'Post',
    posts: [postname],
    deadline: formatDeadline(deadline),
    note: 'Om du tackar nej är du fortfarande kandidat till posten.',
    buttonText: 'Svara på förslaget',
    buttonLink: nominationsLink(electionId),
  });

export const sendProposalWithdrawnMail = (
  electionId: number,
  to: MailRecipient,
  postname: string,
) =>
  send(to, `Valberedningens förslag till ${postname} är återkallat`, {
    heading: 'Förslaget är återkallat',
    intro: 'Valberedningen har dragit tillbaka sitt förslag på dig till posten nedan.',
    postsLabel: 'Post',
    posts: [postname],
    deadline: '',
    note: 'Du är fortfarande kandidat till posten. Om motkandidering är öppen kan du anmäla dig som motkandidat på hemsidan.',
    buttonText: 'Visa dina nomineringar',
    buttonLink: nominationsLink(electionId),
  });

export const sendCounterCandidacyMail = (
  electionId: number,
  to: MailRecipient,
  postname: string,
  deadline: Date,
) =>
  send(to, `Vill du motkandidera till ${postname}?`, {
    heading: 'Vill du motkandidera?',
    intro:
      'Valberedningen har lagt sitt förslag till posten nedan. Du har accepterat din nominering men är inte föreslagen, och kan välja att ställa upp som motkandidat.',
    postsLabel: 'Post',
    posts: [postname],
    deadline: formatDeadline(deadline),
    note: 'Svarar du inte ställer du inte upp som motkandidat.',
    buttonText: 'Svara',
    buttonLink: nominationsLink(electionId),
  });

/**
 * Tells the committee about a member's answer, at the addresses set for the election
 * (the interview settings' recipients). Never throws, like the other mail
 */
export const sendCommitteeAnswerMail = async (
  to: string[],
  electionId: number,
  subject: string,
  lines: string[],
) => {
  try {
    await sendEmail(to, subject, COMMITTEE_TEMPLATE, {
      heading: subject,
      lines,
      buttonText: 'Öppna valberedningens förslag',
      buttonLink: `${config.WEBSITE_URL}/admin/elections/${electionId}/proposals`,
    });
    return true;
  } catch (err) {
    logger.error(`Failed to send "${subject}" to ${to.join(', ')}`);
    logger.error(err);
    return false;
  }
};
