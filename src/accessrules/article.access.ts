import { Access, Feature, ResolversTypes } from '@generated/graphql';

export default function hasAccess(callerAccess: Access, resource: ResolversTypes) {
  const { features } = callerAccess;

  if (features.includes(Feature.ArticleEditor)) {
    return true;
  }

  return false;
}