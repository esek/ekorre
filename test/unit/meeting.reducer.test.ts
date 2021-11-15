import { MeetingType } from '../../src/graphql.generated';
import { DatabaseMeeting } from '../../src/models/db/meeting';
import { meetingReduce } from '../../src/reducers/meeting.reducer';

const dummyDbMeeting: DatabaseMeeting = {
  id: '420',
  type: MeetingType.Sm,
  number: 3,
  year: 1817,
  refsummons: 'a valid file id',
  reflateDocuments: 'another valid file id',
};

test('test reducing a board meeting', () => {
  expect(meetingReduce(dummyDbMeeting)).toStrictEqual({
    id: '420',
    name: 'SM03',
    type: MeetingType.Sm,
    number: 3,
    year: 1817,
    summons: {
      id: 'a valid file id',
    },
    lateDocuments: {
      id: 'another valid file id',
    },
  });
});

test('test reducing a spring term meeting', () => {
  const localDbMeeting = dummyDbMeeting;
  localDbMeeting.type = MeetingType.Vtm;
  expect(meetingReduce(dummyDbMeeting)).toStrictEqual({
    id: '420',
    name: 'VTM 1817',
    type: MeetingType.Vtm,
    number: 3,
    year: 1817,
    summons: {
      id: 'a valid file id',
    },
    lateDocuments: {
      id: 'another valid file id',
    },
  });
});