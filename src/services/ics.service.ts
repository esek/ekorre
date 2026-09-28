/**
 * Minimal iCalendar (RFC 5545) builder for interview invites. Times are written in UTC,
 * so no VTIMEZONE is needed and every client shows them in the reader's own time zone.
 */

export type IcsEvent = {
  /** Stable across updates and the cancellation of the same interview */
  uid: string;
  /** Must increase with every update sent for the same uid */
  sequence: number;
  method: 'REQUEST' | 'CANCEL';
  startsAt: Date;
  endsAt: Date;
  summary: string;
  description?: string;
  location?: string | null;
  url?: string | null;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
  now?: Date;
};

const formatUtc = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** Escapes TEXT values: backslash, semicolon, comma and newlines */
export const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line to at most 75 octets per line, as the spec requires */
export const foldLine = (line: string) => {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  // The first line may hold 75 octets, continuation lines 74 plus the leading space
  let limit = 75;
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8');
    if (currentBytes + size > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      limit = 74;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
};

/** Quoted parameter value, e.g. a display name in CN= */
const paramValue = (value: string) => `"${value.replace(/"/g, "'")}"`;

export const buildIcs = (event: IcsEvent): string => {
  const cancelled = event.method === 'CANCEL';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//E-sektionen//Valberedningen//SV',
    'CALSCALE:GREGORIAN',
    `METHOD:${event.method}`,
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `SEQUENCE:${event.sequence}`,
    `DTSTAMP:${formatUtc(event.now ?? new Date())}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(event.endsAt)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    `ORGANIZER;CN=${paramValue(event.organizer.name)}:mailto:${event.organizer.email}`,
    `ATTENDEE;CN=${paramValue(
      event.attendee.name,
    )};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${event.attendee.email}`,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
};
