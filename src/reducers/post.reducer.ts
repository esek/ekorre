import { DatabasePost } from '@db/post';
import { Access, Post as GqlPost } from '@generated/graphql';

export function postReduce(post: DatabasePost): GqlPost {
  const access: Access = {
    doors: [],
    web: [],
  };

  const p: GqlPost = {
    ...post,
    access,
    history: [], // Det här fylls på senare
  };

  return p;
}
