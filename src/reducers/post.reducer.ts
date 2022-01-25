import { DatabasePost } from '@db/post';
import { Access, Post } from '@generated/graphql';

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
