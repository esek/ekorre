import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ArticleResponse } from './models/mappers';
import type { Context } from './models/context';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
  DateTime: any;
};

export type Query = {
  article?: Maybe<Article>;
  articles: Array<Maybe<Article>>;
  individualAccess?: Maybe<Access>;
  latestnews: Array<Maybe<Article>>;
  newsentries: Array<Maybe<Article>>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  user?: Maybe<User>;
  utskott?: Maybe<Utskott>;
};


export type QueryArticleArgs = {
  id: Scalars['ID'];
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryArticlesArgs = {
  id?: Maybe<Scalars['ID']>;
  creator?: Maybe<Scalars['String']>;
  lastUpdateBy?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  lastUpdatedAt?: Maybe<Scalars['DateTime']>;
  signature?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  articleType?: Maybe<Scalars['String']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryIndividualAccessArgs = {
  username: Scalars['String'];
};


export type QueryLatestnewsArgs = {
  limit?: Maybe<Scalars['Int']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryNewsentriesArgs = {
  creator?: Maybe<Scalars['String']>;
  after?: Maybe<Scalars['DateTime']>;
  before?: Maybe<Scalars['DateTime']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryPostArgs = {
  name: Scalars['String'];
};


export type QueryPostAccessArgs = {
  postname: Scalars['String'];
};


export type QueryPostsArgs = {
  utskott?: Maybe<Utskott>;
};


export type QueryUserArgs = {
  username: Scalars['String'];
};


export type QueryUtskottArgs = {
  name?: Maybe<Scalars['String']>;
};

export type Mutation = {
  addArticle?: Maybe<Article>;
  addPost: Scalars['Boolean'];
  addUsersToPost: Scalars['Boolean'];
  createUser?: Maybe<User>;
  /** Test user credentials and if valid get a jwt token */
  login?: Maybe<Scalars['String']>;
  logout?: Maybe<Scalars['Boolean']>;
  modifyArticle: Scalars['Boolean'];
  refreshToken?: Maybe<Scalars['String']>;
  removeUsersFromPost: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
};


export type MutationAddArticleArgs = {
  entry: NewArticle;
};


export type MutationAddPostArgs = {
  info: NewPost;
};


export type MutationAddUsersToPostArgs = {
  usernames: Array<Scalars['String']>;
  postname: Scalars['String'];
  period: Scalars['Int'];
};


export type MutationCreateUserArgs = {
  input: NewUser;
};


export type MutationLoginArgs = {
  username: Scalars['String'];
  password: Scalars['String'];
};


export type MutationLogoutArgs = {
  token: Scalars['String'];
};


export type MutationModifyArticleArgs = {
  articleId: Scalars['Int'];
  entry: ModifyArticle;
};


export type MutationRefreshTokenArgs = {
  token: Scalars['String'];
};


export type MutationRemoveUsersFromPostArgs = {
  usernames: Array<Scalars['String']>;
  postname: Scalars['String'];
};


export type MutationSetIndividualAccessArgs = {
  username: Scalars['String'];
  access: AccessInput;
};


export type MutationSetPostAccessArgs = {
  postname: Scalars['String'];
  access: AccessInput;
};

/** Access will be treated as a immutable object! */
export type Access = {
  doors: Array<Scalars['String']>;
  web: Array<Scalars['String']>;
};

/** Access input is the entire set of access that resource will have */
export type AccessInput = {
  doors: Array<Scalars['String']>;
  web: Array<Scalars['String']>;
};

export enum ResourceType {
  Door = 'DOOR',
  Web = 'WEB'
}



/** Body is saved as HTML serverside, but edited in MarkDown */
export type Article = {
  id?: Maybe<Scalars['ID']>;
  creator: User;
  lastUpdatedBy: User;
  title: Scalars['String'];
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
  lastUpdatedAt: Scalars['DateTime'];
  signature: Scalars['String'];
  tags: Array<Scalars['String']>;
  articleType: ArticleType;
};

export type NewArticle = {
  creator: Scalars['String'];
  title: Scalars['String'];
  body: Scalars['String'];
  signature: Scalars['String'];
  tags?: Maybe<Array<Scalars['String']>>;
  articleType: ArticleType;
};

/** We don't need every part; It should already exist */
export type ModifyArticle = {
  title?: Maybe<Scalars['String']>;
  body?: Maybe<Scalars['String']>;
  signature?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Scalars['String']>>;
  articleType?: Maybe<ArticleType>;
};

/** News are the ones to be used by a website newsreel */
export enum ArticleType {
  News = 'news',
  Information = 'information'
}

export type User = {
  /** This will be all the access have concated from Posts and personal */
  access: Access;
  class: Scalars['String'];
  lastname: Scalars['String'];
  name: Scalars['String'];
  posts: Array<Post>;
  username: Scalars['String'];
};

export type Post = {
  access: Access;
  history: Array<HistoryEntry>;
  postname: Scalars['String'];
  utskott: Utskott;
};

export type HistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  holder: User;
  postname: Scalars['String'];
  start: Scalars['Date'];
};

export enum Utskott {
  Cm = 'CM',
  E6 = 'E6',
  Enu = 'ENU',
  Fvu = 'FVU',
  Infu = 'INFU',
  Km = 'KM',
  Noju = 'NOJU',
  Nollu = 'NOLLU',
  Other = 'OTHER',
  Sre = 'SRE'
}

export type NewPost = {
  name: Scalars['String'];
  utskott: Utskott;
};

export type NewUser = {
  username: Scalars['String'];
  name: Scalars['String'];
  lastname: Scalars['String'];
  class: Scalars['String'];
  password: Scalars['String'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Query: ResolverTypeWrapper<{}>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Mutation: ResolverTypeWrapper<{}>;
  Access: ResolverTypeWrapper<Access>;
  AccessInput: AccessInput;
  ResourceType: ResourceType;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Article: ResolverTypeWrapper<ArticleResponse>;
  NewArticle: NewArticle;
  ModifyArticle: ModifyArticle;
  ArticleType: ArticleType;
  User: ResolverTypeWrapper<User>;
  Post: ResolverTypeWrapper<Post>;
  HistoryEntry: ResolverTypeWrapper<HistoryEntry>;
  Utskott: Utskott;
  NewPost: NewPost;
  NewUser: NewUser;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  ID: Scalars['ID'];
  Boolean: Scalars['Boolean'];
  String: Scalars['String'];
  Int: Scalars['Int'];
  Mutation: {};
  Access: Access;
  AccessInput: AccessInput;
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  Article: ArticleResponse;
  NewArticle: NewArticle;
  ModifyArticle: ModifyArticle;
  User: User;
  Post: Post;
  HistoryEntry: HistoryEntry;
  NewPost: NewPost;
  NewUser: NewUser;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  article?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryArticleArgs, 'id'>>;
  articles?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryArticlesArgs, never>>;
  individualAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  latestnews?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryLatestnewsArgs, never>>;
  newsentries?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryNewsentriesArgs, never>>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'name'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postname'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, never>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  utskott?: Resolver<Maybe<ResolversTypes['Utskott']>, ParentType, ContextType, RequireFields<QueryUtskottArgs, never>>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addArticle?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<MutationAddArticleArgs, 'entry'>>;
  addPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'usernames' | 'postname' | 'period'>>;
  createUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  login?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'username' | 'password'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLogoutArgs, 'token'>>;
  modifyArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyArticleArgs, 'articleId' | 'entry'>>;
  refreshToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'token'>>;
  removeUsersFromPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveUsersFromPostArgs, 'usernames' | 'postname'>>;
  setIndividualAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetIndividualAccessArgs, 'username' | 'access'>>;
  setPostAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetPostAccessArgs, 'postname' | 'access'>>;
}>;

export type AccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Access'] = ResolversParentTypes['Access']> = ResolversObject<{
  doors?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  web?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type ArticleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Article'] = ResolversParentTypes['Article']> = ResolversObject<{
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  lastUpdatedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastUpdatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  signature?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  articleType?: Resolver<ResolversTypes['ArticleType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  class?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PostResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  history?: Resolver<Array<ResolversTypes['HistoryEntry']>, ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HistoryEntry'] = ResolversParentTypes['HistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  holder?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Access?: AccessResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  Article?: ArticleResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
