import { allow, IRules, shield } from 'graphql-shield';

import { Mutation, Query } from '../../graphql.generated';
import { isAuthenticated } from './auth.middleware';
import { withPermissions } from './permissions.middleware';

/**
 * This is done using a really bad workaround i found here :)
 * https://github.com/maticzav/graphql-shield/issues/352
 */

interface PermissionsSchema {
  Query: Partial<Record<keyof Query | '*', IRules>>;
  Mutation: Partial<Record<keyof Mutation | '*', IRules>>;
}

/**
 * Set permissions for each query and/or mutation
 */
const schema: PermissionsSchema = {
  Query: {
    article: isAuthenticated(),
    me: isAuthenticated(),
    articles: isAuthenticated(),
    latestnews: isAuthenticated(),
    newsentries: isAuthenticated(),
    user: isAuthenticated(),
    individualAccess: withPermissions(['access-editor']),
    postAccess: withPermissions(['access-editor']),
    files: withPermissions(['file-editor']),
    file: withPermissions(['file-editor', 'meeting']),
    fileSystem: withPermissions(['file-editor']),
    accessResource: withPermissions(['resource-editor']),
    accessResources: withPermissions(['resource-editor']),
    post: withPermissions(['post-editor']),
    posts: withPermissions(['post-editor']),
    utskott: withPermissions(['post-editor']),
  },
  Mutation: {
    addAccessResource: withPermissions(['resource-editor']),
    removeAccessResource: withPermissions(['resource-editor']),
    setIndividualAccess: withPermissions(['access-editor']),
    setPostAccess: withPermissions(['access-editor']),
    addArticle: withPermissions(['article-editor']),
    modifyArticle: withPermissions(['article-editor']),
    addPost: withPermissions(['post-editor']),
    modifyPost: withPermissions(['post-editor']),
    addUsersToPost: withPermissions(['post-editor']),
    removeUsersFromPost: withPermissions(['post-editor']),
    createFolder: withPermissions(['file-editor']),
    deleteFile: withPermissions(['file-editor']),
    createUser: withPermissions(['user-editor']),
    updateUser: withPermissions(['user-editor']),
  },
};

export const generateShield = () =>
  shield((schema as unknown) as IRules, {
    allowExternalErrors: true,
    fallbackRule: allow, // default rule is you need to be authenticated
  });
