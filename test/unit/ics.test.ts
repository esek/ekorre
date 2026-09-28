import { buildIcs, escapeText, foldLine, IcsEvent } from '@service/ics';

const event: IcsEvent = {
  uid: 'interview-abc@esek.se',
  sequence: 2,
  method: 'REQUEST',
  startsAt: new Date('2026-10-06T15:00:00Z'),
  endsAt: new Date('2026-10-06T15:30:00Z'),
  summary: 'Intervju med valberedningen',
  description: 'Intervju för: Cophös, Pengamästare',
  location: 'E:1123; plan 1',
  url: 'https://meet.example/abc',
  organizer: { name: 'Valberedningen', email: 'vbordforande@esek.se' },
  attendee: { name: 'Lena "Lenny" Handén', email: 'no0000oh-s@student.lu.se' },
  now: new Date('2026-09-28T12:00:00Z'),
};

/** Unfolds continuation lines, as a calendar client does */
const unfold = (ics: string) => ics.replace(/\r\n /g, '');

describe('escapeText', () => {
  it('escapes the characters that are special in TEXT values', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:kort')).toBe('SUMMARY:kort');
  });

  it('keeps every physical line within 75 octets, without splitting characters', () => {
    const line = `DESCRIPTION:${'åäö'.repeat(60)}`;
    const folded = foldLine(line);
    for (const physical of folded.split('\r\n')) {
      expect(Buffer.byteLength(physical, 'utf8')).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });
});

describe('buildIcs', () => {
  it('writes a well-formed invite with UTC times and CRLF line endings', () => {
    const ics = buildIcs(event);
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);

    const lines = unfold(ics).split('\r\n');
    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'METHOD:REQUEST',
        'UID:interview-abc@esek.se',
        'SEQUENCE:2',
        'DTSTAMP:20260928T120000Z',
        'DTSTART:20261006T150000Z',
        'DTEND:20261006T153000Z',
        'SUMMARY:Intervju med valberedningen',
        'DESCRIPTION:Intervju för: Cophös\\, Pengamästare',
        'LOCATION:E:1123\\; plan 1',
        'URL:https://meet.example/abc',
        'STATUS:CONFIRMED',
        'END:VCALENDAR',
      ]),
    );
  });

  it('does not let a quote in a name break the parameter', () => {
    const attendee = unfold(buildIcs(event))
      .split('\r\n')
      .find((l) => l.startsWith('ATTENDEE'));
    expect(attendee).toBe(
      'ATTENDEE;CN="Lena \'Lenny\' Handén";ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:no0000oh-s@student.lu.se',
    );
  });

  it('marks cancellations', () => {
    const lines = unfold(buildIcs({ ...event, method: 'CANCEL', sequence: 3 })).split('\r\n');
    expect(lines).toEqual(
      expect.arrayContaining(['METHOD:CANCEL', 'STATUS:CANCELLED', 'SEQUENCE:3']),
    );
  });

  it('omits optional fields that are missing', () => {
    const ics = buildIcs({ ...event, description: undefined, location: null, url: null });
    expect(ics).not.toMatch(/DESCRIPTION|LOCATION|URL:/);
  });
});
