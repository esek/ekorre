import type { HistoryEntry, Post } from '../../graphql.generated';

export type DatabasePost = Omit<Post, 'history' | 'access'>;
export type DatabasePostHistory = Omit<HistoryEntry, 'holder' | 'postname'> & {
  refpost: string;
  refuser: string;
  period: number;
};
