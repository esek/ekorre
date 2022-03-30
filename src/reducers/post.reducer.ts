import { Access, Post, PostType, Utskott } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';

export function postReduce(post: PrismaPost): Post {
  const access: Access = {
    doors: [],
    features: [],
  };

  const p: Post = {
    ...post,
    access,
    postType: post.postType as PostType,
    utskott: post.utskott as Utskott,
    history: [], // Det här fylls på senare,
  };

  return p;
}
