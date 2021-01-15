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
    history: [] // This will be thunk?
  };

  return p;
}

export async function postReducer(incoming: PostModel): Promise<Post>;
export async function postReducer(incoming: PostModel[]): Promise<Post[]>;
export async function postReducer(incoming: PostModel | PostModel[]): Promise<Post | Post[]> {
  if (incoming instanceof Array) {
    const posts = await Promise.all(incoming.map((e) => postReduce(e)));
    return posts;
  }
  return postReduce(incoming);
}