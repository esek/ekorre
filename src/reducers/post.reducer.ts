import { Access, Post, PostType, Utskott } from '@generated/graphql';
import { PrismaPost } from '@prisma/client';

export function postReduce(post: PrismaPost): Post {
  const { postType, utskott, description, ...reduced } = post;

  const access: Access = {
    doors: [],
    features: [],
  };

  const p: Post = {
    ...reduced,
    description,
    shortDescription: description.replace(/([.!?]+\s.+?\s.+?)[\s.!?].*/s, '$1...'),
    access,
    postType: postType as PostType,
    utskott: utskott as Utskott,
    history: [], // This is filled by resolver
  };

  return p;
}
