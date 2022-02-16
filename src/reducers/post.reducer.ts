import { Access, Post } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';

export function postReduce(post: PrismaPost): Post {
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
