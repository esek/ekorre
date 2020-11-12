/* eslint-disable class-methods-use-this */
import { Post, HistoryEntry } from '../graphql.generated';
import { Logger } from '../logger';
import knex from './knex';

const logger = Logger.getLogger('PostAPI');

const POSTS_TABLE = 'Posts';

export type PostModel = Omit<Post, 'history' | 'access'>;
export type PostHistoryModel = Omit<HistoryEntry, 'holders'> & {
  holder: string
};

/**
 * This is the api for adding and removing user access.
 */
export default class PostAPI {
}
