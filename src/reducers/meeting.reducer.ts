import { MeetingDocumentType, MeetingType } from '../graphql.generated';
import { DatabaseMeeting } from '../models/db/meeting';
import { MeetingResponse } from '../models/mappers';

// Adds leading zeroes to a number and returns as string
const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
const addIfRefNotNull = (
  obj: Partial<MeetingResponse>,
  type: MeetingDocumentType,
  ref?: string,
) => {
  // If not null or undefined uses !=
  if (ref != null) {
    // obj is passed by reference; We add to it here
    // eslint-disable-next-line no-param-reassign
    obj[type] = { id: ref };
  }
};

export function meetingReduce(meeting: DatabaseMeeting): MeetingResponse {
  let name: string;

  if (meeting.type === MeetingType.Sm || meeting.type === MeetingType.Extra) {
    name = `${meeting.type}${zeroPad(meeting.number, 2)}`;
  } else {
    name = `${meeting.type} ${meeting.year}`;
  }

  // If a reference is missing, the documents is not to be added to response
  const { refsummons, refdocuments, reflateDocuments, refprotocol, ...reduced } = meeting;
  const m = {
    ...reduced,
    name,
  };

  // Add stubs to be resolved by file resolver
  addIfRefNotNull(m, MeetingDocumentType.Summons, refsummons);
  addIfRefNotNull(m, MeetingDocumentType.Documents, refdocuments);
  addIfRefNotNull(m, MeetingDocumentType.LateDocuments, reflateDocuments);
  addIfRefNotNull(m, MeetingDocumentType.Protocol, refprotocol);

  return m;
}
