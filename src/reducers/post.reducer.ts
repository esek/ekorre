import { Access, Post } from '../graphql.generated';
import { DatabasePost } from '../models/db/post';

export function postReduce(post: DatabasePost): Post {
  const access: Access = {
    doors: [],
    web: [],
  };

  const p: Post = {
    ...post,
    access,
    history: [], // Det här fylls på senare
  };

  return p;
}
