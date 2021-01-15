import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { Context } from './context';
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
};

export type Query = {
  individualAccess?: Maybe<Access>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  user?: Maybe<User>;
  users?: Maybe<Array<Maybe<User>>>;
  utskott?: Maybe<Utskott>;
};


export type QueryIndividualAccessArgs = {
  username: Scalars['String'];
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


export type QueryUsersArgs = {
  postname?: Maybe<Scalars['String']>;
};


export type QueryUtskottArgs = {
  name?: Maybe<Scalars['String']>;
};

export type Mutation = {
  addPost: Scalars['Boolean'];
  addUsersToPost: Scalars['Boolean'];
  createUser?: Maybe<User>;
  /** Test user credentials and if valid get a jwt token */
  login?: Maybe<Scalars['String']>;
  removeUsersFromPost: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
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


export type Post = {
  access: Access;
  history: Array<HistoryEntry>;
  postname: Scalars['String'];
  utskott: Utskott;
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

export type HistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  holder: User;
  postname: Scalars['String'];
  start: Scalars['Date'];
};

export type User = {
  /** This will be all the access have concated from Posts and personal */
  access: Access;
  class: Scalars['String'];
  lastname: Scalars['String'];
  name: Scalars['String'];
  posts: Array<Post>;
  username: Scalars['String'];
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
  String: ResolverTypeWrapper<Scalars['String']>;
  Mutation: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Access: ResolverTypeWrapper<Access>;
  AccessInput: AccessInput;
  ResourceType: ResourceType;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  Post: ResolverTypeWrapper<Post>;
  Utskott: Utskott;
  NewPost: NewPost;
  HistoryEntry: ResolverTypeWrapper<HistoryEntry>;
  User: ResolverTypeWrapper<User>;
  NewUser: NewUser;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  String: Scalars['String'];
  Mutation: {};
  Boolean: Scalars['Boolean'];
  Int: Scalars['Int'];
  Access: Access;
  AccessInput: AccessInput;
  Date: Scalars['Date'];
  Post: Post;
  NewPost: NewPost;
  HistoryEntry: HistoryEntry;
  User: User;
  NewUser: NewUser;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  individualAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'name'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postname'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, never>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, RequireFields<QueryUsersArgs, never>>;
  utskott?: Resolver<Maybe<ResolversTypes['Utskott']>, ParentType, ContextType, RequireFields<QueryUtskottArgs, never>>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'usernames' | 'postname' | 'period'>>;
  createUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  login?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'username' | 'password'>>;
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

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  class?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Access?: AccessResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Post?: PostResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
