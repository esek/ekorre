import type { Meeting } from '../../graphql.generated';

// prettier-ignore
export type DatabaseMeeting = Omit<Meeting, 'name' | 'summons' | 'documents' | 'lateDocuments' | 'protocol' | 'appendix'
> & {
  refsummons?: string;
  refdocuments?: string;
  reflateDocuments?: string;
  refprotocol?: string;
  refappendix?: string;
};
