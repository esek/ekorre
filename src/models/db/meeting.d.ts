import type { Meeting } from '../../graphql.generated';

export type DatabaseMeeting = Omit<
  Meeting,
  'name' | 'summons' | 'documents' | 'lateDocuments' | 'protocol'
> & {
  refsummons?: string;
  refdocuments?: string;
  reflateDocuments?: string;
  refprotocol?: string;
};
