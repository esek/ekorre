import type { HistoryEntry, Post } from '@generated/graphql';

export type DatabasePost = Omit<Post, 'history' | 'access'>;
export type DatabasePostHistory = Omit<HistoryEntry, 'holder' | 'postname' | 'start' | 'end'> & {
  refpost: string;
  refuser: string;
  start: number;
  end?: number;
};
