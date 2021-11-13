import { MeetingAPI } from '../api/meeting.api';
import type { Resolvers } from '../graphql.generated';

const api = new MeetingAPI();

const meetingResolver: Resolvers = {
  Query: {

  },
  Mutation: {

  }
};

export default meetingResolver;