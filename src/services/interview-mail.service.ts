/**
 * Mail for interview booking. Every change to what a nominee has booked produces exactly
 * one mail. Confirmed bookings carry a calendar invite; a cancellation carries a calendar
 * cancellation so the event disappears. Admin requests carry no invite, since nothing is
 * booked until the nominee accepts.
 *
 * Sending never throws: the booking in the database is the source of truth, so a mail
 * failure is logged and the change stands.
 */
import config from '@/config';
import { Logger } from '@/logger';
import { EmailAttachment, sendEmail } from '@service/email';
import { buildIcs } from '@service/ics';

const logger = Logger.getLogger('InterviewMail');

export const NOMINEE_TEMPLATE = 'interview';
export const COMMITTEE_TEMPLATE = 'interview-committee';

export type MailPerson = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type MailSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  videoLink: string | null;
  sequence: number;
};

const COMMITTEE_NAME = 'Valberedningen';

const interviewLink = (electionId: number) =>
  `${config.WEBSITE_URL}/member/election/mine/${electionId}`;

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  hour: '2-digit',
  minute: '2-digit',
});

/** e.g. "tisdag 6 oktober 2026 kl. 17:00–17:30" in Stockholm time */
export const formatSlot = (startsAt: Date, endsAt: Date) =>
  `${dateFormat.format(startsAt)} kl. ${timeFormat.format(startsAt)}–${timeFormat.format(endsAt)}`;

/**
 * The time is always labelled with its status, so a removed or proposed time can never
 * be mistaken for a booking when skimming the mail
 */
type TimeStatus = 'BOOKED' | 'REMOVED' | 'PROPOSED' | 'WITHDRAWN';

const timeLabels: Record<TimeStatus, string> = {
  BOOKED: 'Bokad tid',
  REMOVED: 'Avbokad tid',
  PROPOSED: 'Föreslagen tid',
  WITHDRAWN: 'Återkallat förslag',
};

const slotOverrides = (slot: Omit<MailSlot, 'id' | 'sequence'>, status: TimeStatus) => ({
  time: formatSlot(slot.startsAt, slot.endsAt),
  timeLabel: timeLabels[status],
  // Only non-empty strings are truthy in the template
  struck: status === 'REMOVED' || status === 'WITHDRAWN' ? 'yes' : '',
  location: slot.location ?? '',
  // No clickable meeting link for a time that no longer applies
  videoLink: status === 'BOOKED' || status === 'PROPOSED' ? slot.videoLink ?? '' : '',
});

const calendarAttachment = (
  slot: MailSlot,
  nominee: MailPerson,
  organizerEmail: string,
  postnames: string[],
  method: 'REQUEST' | 'CANCEL',
  sequence: number,
): EmailAttachment => {
  const ics = buildIcs({
    uid: `interview-${slot.id}@esek.se`,
    sequence,
    method,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    summary: 'Intervju med valberedningen',
    description: postnames.length ? `Intervju för: ${postnames.join(', ')}` : undefined,
    location: slot.location ?? slot.videoLink,
    url: slot.videoLink,
    organizer: { name: COMMITTEE_NAME, email: organizerEmail },
    attendee: { name: `${nominee.firstName} ${nominee.lastName}`, email: nominee.email },
  });
  return {
    filename: method === 'CANCEL' ? 'intervju-avbokad.ics' : 'intervju.ics',
    contentType: `text/calendar; charset=utf-8; method=${method}`,
    content: Buffer.from(ics, 'utf8').toString('base64'),
  };
};

const send = async (
  to: string | string[],
  subject: string,
  template: string,
  overrides: Record<string, string | string[]>,
  attachments?: EmailAttachment[],
) => {
  try {
    await sendEmail(to, subject, template, overrides, undefined, attachments);
    return true;
  } catch (err) {
    logger.error(`Failed to send "${subject}" to ${String(to)}`);
    logger.error(err);
    return false;
  }
};

export type BookingMailKind =
  | 'BOOKED'
  | 'RESCHEDULED'
  | 'REQUEST_ACCEPTED'
  | 'POSTS_ADDED'
  | 'POSTS_REMOVED'
  | 'RELOCATED';

const bookingCopy: Record<BookingMailKind, { subject: string; heading: string; intro: string }> = {
  BOOKED: {
    subject: 'Din intervju är bokad',
    heading: 'Din intervju är bokad',
    intro: 'Du har bokat en intervju med valberedningen.',
  },
  RESCHEDULED: {
    subject: 'Din intervju är ombokad',
    heading: 'Din intervju är ombokad',
    intro: 'Du har bokat om din intervju. Den tidigare tiden gäller inte längre.',
  },
  REQUEST_ACCEPTED: {
    subject: 'Din intervju är bokad',
    heading: 'Din intervju är bokad',
    intro: 'Du har accepterat valberedningens förslag på tid.',
  },
  POSTS_ADDED: {
    subject: 'Din intervju gäller nu fler poster',
    heading: 'Din intervju gäller nu fler poster',
    intro:
      'Du har accepterat ytterligare en nominering. Din bokning är kvar eftersom den redan har maximal längd, och gäller nu även den nya posten.',
  },
  POSTS_REMOVED: {
    subject: 'Din intervju gäller nu färre poster',
    heading: 'Din intervju gäller nu färre poster',
    intro:
      'Du har tackat nej till en nominering. Din bokning är kvar med samma tid och längd, men gäller nu färre poster.',
  },
  RELOCATED: {
    subject: 'Ny plats för din intervju',
    heading: 'Ny plats för din intervju',
    intro: 'Valberedningen har ändrat plats eller länk för din intervju. Tiden är densamma.',
  },
};

export const sendBookingMail = (
  kind: BookingMailKind,
  electionId: number,
  nominee: MailPerson,
  booking: MailSlot,
  postnames: string[],
  organizerEmail: string,
) => {
  const copy = bookingCopy[kind];
  return send(
    nominee.email,
    copy.subject,
    NOMINEE_TEMPLATE,
    {
      firstName: nominee.firstName,
      heading: copy.heading,
      intro: copy.intro,
      ...slotOverrides(booking, 'BOOKED'),
      posts: postnames,
      note: 'Kalenderinbjudan finns bifogad.',
      buttonText: 'Visa din intervju',
      buttonLink: interviewLink(electionId),
    },
    [calendarAttachment(booking, nominee, organizerEmail, postnames, 'REQUEST', booking.sequence)],
  );
};

export type RemovalReason = 'CANCELLED_BY_NOMINEE' | 'CANCELLED_BY_ADMIN' | 'UNBOOKED' | 'FREED';

const removalCopy: Record<RemovalReason, { subject: string; intro: string; rebook: boolean }> = {
  CANCELLED_BY_NOMINEE: {
    subject: 'Din intervju är avbokad',
    intro: 'Du har avbokat din intervju.',
    rebook: true,
  },
  CANCELLED_BY_ADMIN: {
    subject: 'Din intervju är avbokad',
    intro: 'Valberedningen har avbokat din intervju.',
    rebook: true,
  },
  UNBOOKED: {
    subject: 'Din intervju är avbokad – boka en ny tid',
    intro:
      'Du har accepterat en nominering som kräver en längre intervju, så din tidigare bokning har tagits bort. Du har ingen bokad intervju just nu.',
    rebook: true,
  },
  FREED: {
    subject: 'Din intervju är avbokad',
    intro:
      'Du har inga accepterade nomineringar kvar som kräver intervju, så din bokning har tagits bort.',
    rebook: false,
  },
};

export const sendBookingRemovedMail = (
  reason: RemovalReason,
  electionId: number,
  nominee: MailPerson,
  booking: MailSlot,
  organizerEmail: string,
) => {
  const copy = removalCopy[reason];
  return send(
    nominee.email,
    copy.subject,
    NOMINEE_TEMPLATE,
    {
      firstName: nominee.firstName,
      heading: 'Din intervju är avbokad',
      intro: copy.intro,
      ...slotOverrides(booking, 'REMOVED'),
      posts: [],
      note: copy.rebook
        ? 'Tiden ovan gäller inte längre. Boka en ny tid på hemsidan.'
        : 'Tiden ovan gäller inte längre.',
      buttonText: copy.rebook ? 'Boka ny tid' : 'Visa dina nomineringar',
      buttonLink: interviewLink(electionId),
    },
    [calendarAttachment(booking, nominee, organizerEmail, [], 'CANCEL', booking.sequence + 1)],
  );
};

export const sendRequestMail = (
  electionId: number,
  nominee: MailPerson,
  request: Omit<MailSlot, 'sequence'>,
  postnames: string[],
) =>
  send(nominee.email, 'Valberedningen föreslår en intervjutid', NOMINEE_TEMPLATE, {
    firstName: nominee.firstName,
    heading: 'Förslag på intervjutid',
    intro:
      'Valberedningen föreslår en tid för din intervju. Tiden är inte bokad förrän du har accepterat den på hemsidan.',
    ...slotOverrides(request, 'PROPOSED'),
    posts: postnames,
    note: 'Om du redan har en bokad intervju gäller den tills du accepterar den nya tiden.',
    buttonText: 'Svara på förslaget',
    buttonLink: interviewLink(electionId),
  });

export const sendRequestWithdrawnMail = (
  electionId: number,
  nominee: MailPerson,
  request: Omit<MailSlot, 'sequence'>,
  becauseNominationsChanged: boolean,
) =>
  send(nominee.email, 'Förslaget på intervjutid gäller inte längre', NOMINEE_TEMPLATE, {
    firstName: nominee.firstName,
    heading: 'Förslaget gäller inte längre',
    intro: becauseNominationsChanged
      ? 'Dina nomineringar har ändrats så att intervjun behöver en annan längd, så valberedningens förslag på tid har dragits tillbaka.'
      : 'Valberedningen har dragit tillbaka sitt förslag på tid.',
    ...slotOverrides(request, 'WITHDRAWN'),
    posts: [],
    note: 'Tiden ovan har aldrig varit bokad.',
    buttonText: 'Visa din intervju',
    buttonLink: interviewLink(electionId),
  });

export const sendSlotsUpdatedMail = (electionId: number, nominee: MailPerson) =>
  send(nominee.email, 'Nya intervjutider finns', NOMINEE_TEMPLATE, {
    firstName: nominee.firstName,
    heading: 'Nya intervjutider finns',
    intro:
      'Valberedningen har uppdaterat intervjutiderna. Du har accepterat en nominering som kräver intervju men har ingen bokad tid.',
    time: '',
    timeLabel: '',
    struck: '',
    location: '',
    videoLink: '',
    posts: [],
    note: '',
    buttonText: 'Boka intervju',
    buttonLink: interviewLink(electionId),
  });

export const sendCommitteeMail = (
  to: string[],
  subject: string,
  heading: string,
  lines: string[],
  electionId: number,
) =>
  send(to, subject, COMMITTEE_TEMPLATE, {
    heading,
    lines,
    buttonText: 'Öppna intervjuöversikten',
    buttonLink: `${config.WEBSITE_URL}/admin/elections/${electionId}/interviews`,
  });
