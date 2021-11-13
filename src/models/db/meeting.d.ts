import type { Meeting } from '../../graphql.generated';

export type DatabaseMeeting = Omit<Meeting, 'summons' | 'documents' | 'lateDocuments' | 'protocol'> & {
  refsummons: string;
  refdocuments: string;
  reflateDocuments: string;
  refprotocol: string;
};
