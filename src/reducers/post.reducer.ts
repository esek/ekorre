import { Access, Post, PostType, Utskott } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';

export function postReduce(post: PrismaPost): Post {
  const { postType, utskott, ...reduced } = post;

  const access: Access = {
    doors: [],
    features: [],
  };

  const p: Post = {
    ...reduced,
    access,
    postType: postType as PostType,
    utskott: utskott as Utskott,
    history: [], // This is filled by resolver
  };

  return p;
}
