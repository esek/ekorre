import { MeetingResponse } from '@/models/mappers';
import { MeetingDocumentType, MeetingType } from '@generated/graphql';
import { PrismaMeeting } from '@prisma/client';

// Adds leading zeroes to a number and returns as string
const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
const addIfRefNotNull = (
  obj: Partial<MeetingResponse>,
  type: MeetingDocumentType,
  ref: string | null,
) => {
  // If not null or undefined uses !=
  if (ref != null) {
    // obj is passed by reference; We add to it here
    // eslint-disable-next-line no-param-reassign
    obj[type] = { id: ref };
  }
};

export function meetingReduce(meeting: PrismaMeeting): MeetingResponse {
  let name: string;
  const guildMeetings = [MeetingType.Htm, MeetingType.Vtm, MeetingType.Vm, MeetingType.Extra];
  if (guildMeetings.some((m) => m == meeting.type)) {
    name = `${meeting.type} ${meeting.year}`;
  } else {
    name = `${meeting.type}${zeroPad(meeting.number, 2)}`;
  }

  // If a reference is missing, the documents is not to be added to response
  const {
    refSummons,
    refAgenda,
    refDocuments,
    refLateDocuments,
    refProtocol,
    refAppendix,
    type,
    ...reduced
  } = meeting;

  const m = {
    ...reduced,
    name,
    type: type as MeetingType,
  };

  // Add stubs to be resolved by file resolver
  addIfRefNotNull(m, MeetingDocumentType.Summons, refSummons);
  addIfRefNotNull(m, MeetingDocumentType.Agenda, refAgenda);
  addIfRefNotNull(m, MeetingDocumentType.Documents, refDocuments);
  addIfRefNotNull(m, MeetingDocumentType.LateDocuments, refLateDocuments);
  addIfRefNotNull(m, MeetingDocumentType.Protocol, refProtocol);
  addIfRefNotNull(m, MeetingDocumentType.Appendix, refAppendix);

  return m;
}
