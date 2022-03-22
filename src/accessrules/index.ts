import hasArticleAccess from './article.access';
import { Access, ResolversTypes } from '@generated/graphql';

export function hasAccess(callerAccess: Access, resource: ResolversTypes) {
  const { features } = callerAccess;

  if (hasArticleAccess(callerAccess, resource)) {
    return true;
  }

  return false;
}