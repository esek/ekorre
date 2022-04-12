import { MeetingResponse } from '@/models/mappers';
import { meetingReduce } from '@/reducers/meeting.reducer';
import { MeetingType } from '@generated/graphql';
import { PrismaMeeting } from '@prisma/client';

const dummyDbMeeting: PrismaMeeting = {
  id: 420,
  type: MeetingType.Sm,
  number: 3,
  year: 1817,
  refSummons: 'a valid file id',
  refLateDocuments: 'another valid file id',
  refAppendix: 'yet another valid file id',
  refDocuments: 'a valid file id',
  refProtocol: 'a valid file id',
};

const expected: MeetingResponse = {
  name: `${dummyDbMeeting.type}${String(dummyDbMeeting.number).padStart(2, '0')}`,
  id: dummyDbMeeting.id,
  number: dummyDbMeeting.number,
  year: dummyDbMeeting.year,
  type: dummyDbMeeting.type as MeetingType,
  documents: {
    id: dummyDbMeeting.refDocuments ?? undefined,
  },
  lateDocuments: {
    id: dummyDbMeeting.refLateDocuments ?? undefined,
  },
  protocol: {
    id: dummyDbMeeting.refProtocol ?? undefined,
  },
  appendix: {
    id: dummyDbMeeting.refAppendix ?? undefined,
  },
  summons: {
    id: dummyDbMeeting.refSummons ?? undefined,
  },
};

test('test reducing a board meeting', () => {
  expect(meetingReduce(dummyDbMeeting)).toStrictEqual(expected);
});

test('test reducing a spring term meeting', () => {
  const localDbMeeting = { ...dummyDbMeeting };
  localDbMeeting.type = MeetingType.Vtm;
  const localExpected = { ...expected };
  localExpected.name = `${MeetingType.Vtm} ${String(dummyDbMeeting.year).padStart(2, '0')}`;
  localExpected.type = localDbMeeting.type as MeetingType;
  expect(meetingReduce(localDbMeeting)).toStrictEqual(localExpected);
});
