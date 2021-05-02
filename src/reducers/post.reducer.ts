import { PostModel } from '../api/post.api';
import { Access, Post } from '../graphql.generated';

export function postReduce(post: PostModel): Post {
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
