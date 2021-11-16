import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ArticleResponse, FileResponse, MeetingResponse } from './models/mappers';
import type { Context } from './models/context';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
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



/** Access will be treated as a immutable object! */
export type Access = {
  doors: Array<AccessResource>;
  web: Array<AccessResource>;
};

export type AccessResource = {
  description: Scalars['String'];
  name: Scalars['String'];
  resourceType: AccessResourceType;
  slug: Scalars['String'];
};

export enum AccessResourceType {
  Door = 'DOOR',
  Web = 'WEB'
}

export enum AccessType {
  Admin = 'admin',
  Authenticated = 'authenticated',
  Public = 'public'
}

/** Body is saved as HTML serverside, but edited in MarkDown */
export type Article = {
  articleType: ArticleType;
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
  creator: User;
  id?: Maybe<Scalars['ID']>;
  lastUpdatedAt: Scalars['DateTime'];
  lastUpdatedBy: User;
  signature: Scalars['String'];
  slug?: Maybe<Scalars['String']>;
  tags: Array<Scalars['String']>;
  title: Scalars['String'];
};

/** News are the ones to be used by a website newsreel */
export enum ArticleType {
  News = 'news',
  Information = 'information'
}

export type CasLoginResponse = {
  exists: Scalars['Boolean'];
  hash?: Maybe<Scalars['String']>;
  username: Scalars['String'];
};



export type File = {
  accessType: AccessType;
  createdAt: Scalars['DateTime'];
  createdBy?: Maybe<User>;
  folderLocation: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  size: Scalars['Int'];
  type: FileType;
  url?: Maybe<Scalars['String']>;
};

export type FileSystemResponse = {
  files: Array<File>;
  path: Array<FileSystemResponsePath>;
};

export type FileSystemResponsePath = {
  id: Scalars['ID'];
  name: Scalars['String'];
};

export enum FileType {
  Code = 'code',
  Folder = 'folder',
  Image = 'image',
  Other = 'other',
  Pdf = 'pdf',
  Powerpoint = 'powerpoint',
  Spreadsheet = 'spreadsheet',
  Text = 'text'
}

export type HistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  holder: User;
  postname: Scalars['String'];
  start: Scalars['Date'];
};

export type Me = {
  accessExpiry: Scalars['Float'];
  refreshExpiry: Scalars['Float'];
  user?: Maybe<User>;
};

export type Meeting = {
  /** Handlingar */
  documents?: Maybe<File>;
  id: Scalars['ID'];
  lateDocuments?: Maybe<File>;
  name: Scalars['String'];
  /**
   * Styrelse- och extrainsatta möten har nummer efter hur många
   * som varit det året (börjar på 1). VM/VTM/HTM får också
   * för enkelhetens skull
   */
  number: Scalars['Int'];
  protocol?: Maybe<File>;
  /** Kallelse */
  summons?: Maybe<File>;
  type: MeetingType;
  year: Scalars['Int'];
};

export enum MeetingDocumentType {
  /** Kallelse */
  Summons = 'summons',
  /** Handlingar */
  Documents = 'documents',
  LateDocuments = 'lateDocuments',
  Protocol = 'protocol'
}

export enum MeetingType {
  /** Styrelsemöte */
  Sm = 'SM',
  /** Höstterminsmöte */
  Htm = 'HTM',
  /** Valmöte */
  Vm = 'VM',
  /** Vårterminsmöte */
  Vtm = 'VTM',
  /** Extrainsatt Sektionsmöte */
  Extra = 'Extra'
}

/** We don't need every part; It should already exist */
export type ModifyArticle = {
  articleType?: Maybe<ArticleType>;
  body?: Maybe<Scalars['String']>;
  signature?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type ModifyPost = {
  description?: Maybe<Scalars['String']>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  postType?: Maybe<PostType>;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: Maybe<Scalars['Int']>;
  utskott?: Maybe<Utskott>;
};

export type Mutation = {
  addAccessResource: Scalars['Boolean'];
  addArticle?: Maybe<Article>;
  addFileToMeeting: Scalars['Boolean'];
  addMeeting: Scalars['Boolean'];
  addPost: Scalars['Boolean'];
  addUsersToPost: Scalars['Boolean'];
  casCreateUser: Scalars['Boolean'];
  casLogin: CasLoginResponse;
  createFolder: Scalars['Boolean'];
  createUser: Scalars['Boolean'];
  deleteFile: Scalars['Boolean'];
  /** Test user credentials and if valid get a jwt token */
  login?: Maybe<User>;
  logout?: Maybe<Scalars['Boolean']>;
  modifyArticle: Scalars['Boolean'];
  modifyPost: Scalars['Boolean'];
  removeAccessResource: Scalars['Boolean'];
  removeFileFromMeeting: Scalars['Boolean'];
  removeMeeting: Scalars['Boolean'];
  removeUsersFromPost: Scalars['Boolean'];
  requestPasswordReset: Scalars['Boolean'];
  resetPassword: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
  updateUser: Scalars['Boolean'];
  validatePasswordResetToken: Scalars['Boolean'];
};


export type MutationAddAccessResourceArgs = {
  name: Scalars['String'];
  description: Scalars['String'];
  resourceType: AccessResourceType;
};


export type MutationAddArticleArgs = {
  entry: NewArticle;
};


export type MutationAddFileToMeetingArgs = {
  fileId: Scalars['ID'];
  fileType: MeetingDocumentType;
  meetingId: Scalars['ID'];
};


export type MutationAddMeetingArgs = {
  number?: Maybe<Scalars['Int']>;
  type: MeetingType;
  year?: Maybe<Scalars['Int']>;
};


export type MutationAddPostArgs = {
  info: NewPost;
};


export type MutationAddUsersToPostArgs = {
  period: Scalars['Int'];
  postname: Scalars['String'];
  usernames: Array<Scalars['String']>;
};


export type MutationCasCreateUserArgs = {
  hash: Scalars['String'];
  input: NewUser;
};


export type MutationCasLoginArgs = {
  token: Scalars['String'];
};


export type MutationCreateFolderArgs = {
  name: Scalars['String'];
  path: Scalars['String'];
};


export type MutationCreateUserArgs = {
  input: NewUser;
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID'];
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationModifyArticleArgs = {
  articleId: Scalars['Int'];
  entry: ModifyArticle;
};


export type MutationModifyPostArgs = {
  info: ModifyPost;
};


export type MutationRemoveAccessResourceArgs = {
  slug: Scalars['String'];
};


export type MutationRemoveFileFromMeetingArgs = {
  fileType: MeetingDocumentType;
  meetingId: Scalars['ID'];
};


export type MutationRemoveMeetingArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUsersFromPostArgs = {
  postname: Scalars['String'];
  usernames: Array<Scalars['String']>;
};


export type MutationRequestPasswordResetArgs = {
  username: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  password: Scalars['String'];
  token: Scalars['String'];
  username: Scalars['String'];
};


export type MutationSetIndividualAccessArgs = {
  access: Array<Scalars['Int']>;
  username: Scalars['String'];
};


export type MutationSetPostAccessArgs = {
  access: Array<Scalars['Int']>;
  postname: Scalars['String'];
};


export type MutationUpdateUserArgs = {
  input: UpdateUser;
};


export type MutationValidatePasswordResetTokenArgs = {
  token: Scalars['String'];
  username: Scalars['String'];
};

export type NewArticle = {
  articleType: ArticleType;
  body: Scalars['String'];
  creator: Scalars['String'];
  signature: Scalars['String'];
  tags?: Maybe<Array<Scalars['String']>>;
  title: Scalars['String'];
};

export type NewPost = {
  description?: Maybe<Scalars['String']>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  postType: PostType;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: Maybe<Scalars['Int']>;
  utskott: Utskott;
};

export type NewUser = {
  class: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  firstName: Scalars['String'];
  isFuncUser?: Maybe<Scalars['Boolean']>;
  lastName: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};

export type Post = {
  access: Access;
  active: Scalars['Boolean'];
  description: Scalars['String'];
  history: Array<HistoryEntry>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
  postType: PostType;
  postname: Scalars['String'];
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots: Scalars['Int'];
  utskott: Utskott;
};

/** Hur en post tillsätts enligt Reglementet */
export enum PostType {
  /**
   * Erfoderligt antal, dvs. så många som anses
   * passande
   */
  Ea = 'EA',
  /** Exakt _n_ stycken */
  ExactN = 'EXACT_N',
  /** Upp till _n_ stycken */
  N = 'N',
  /** Unik, finns bara 1, t.ex. utskottsordförande */
  U = 'U'
}

export type Query = {
  accessResource: AccessResource;
  accessResources: Array<AccessResource>;
  article?: Maybe<Article>;
  articles: Array<Maybe<Article>>;
  file: File;
  fileSystem: FileSystemResponse;
  files: Array<File>;
  individualAccess?: Maybe<Access>;
  latestBoardMeetings: Array<Maybe<Meeting>>;
  latestnews: Array<Maybe<Article>>;
  me?: Maybe<Me>;
  meeting?: Maybe<Meeting>;
  meetings: Array<Maybe<Meeting>>;
  newsentries: Array<Maybe<Article>>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  user?: Maybe<User>;
  utskott?: Maybe<Utskott>;
};


export type QueryAccessResourceArgs = {
  slug: Scalars['String'];
};


export type QueryAccessResourcesArgs = {
  type?: Maybe<AccessResourceType>;
};


export type QueryArticleArgs = {
  id?: Maybe<Scalars['ID']>;
  markdown?: Maybe<Scalars['Boolean']>;
  slug?: Maybe<Scalars['String']>;
};


export type QueryArticlesArgs = {
  articleType?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  creator?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  lastUpdateBy?: Maybe<Scalars['String']>;
  lastUpdatedAt?: Maybe<Scalars['DateTime']>;
  markdown?: Maybe<Scalars['Boolean']>;
  signature?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};


export type QueryFileArgs = {
  id: Scalars['ID'];
};


export type QueryFileSystemArgs = {
  folder: Scalars['String'];
};


export type QueryFilesArgs = {
  type?: Maybe<FileType>;
};


export type QueryIndividualAccessArgs = {
  username: Scalars['String'];
};


export type QueryLatestBoardMeetingsArgs = {
  limit?: Maybe<Scalars['Int']>;
};


export type QueryLatestnewsArgs = {
  limit?: Maybe<Scalars['Int']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryMeetingArgs = {
  id: Scalars['ID'];
};


export type QueryMeetingsArgs = {
  number?: Maybe<Scalars['Int']>;
  type?: Maybe<MeetingType>;
  year?: Maybe<Scalars['Int']>;
};


export type QueryNewsentriesArgs = {
  after?: Maybe<Scalars['DateTime']>;
  before?: Maybe<Scalars['DateTime']>;
  creator?: Maybe<Scalars['String']>;
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

export type UpdateUser = {
  address?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
  zipCode?: Maybe<Scalars['String']>;
};

export type User = {
  /** This will be all the access have concated from Posts and personal */
  access: Access;
  address?: Maybe<Scalars['String']>;
  class: Scalars['String'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  isFuncUser?: Maybe<Scalars['Boolean']>;
  lastName: Scalars['String'];
  phone?: Maybe<Scalars['String']>;
  photoUrl?: Maybe<Scalars['String']>;
  /** Currents posts held by this user */
  posts: Array<Post>;
  /** Past and current posts held by this user */
  userPostHistory: Array<Maybe<UserPostHistoryEntry>>;
  username: Scalars['String'];
  website?: Maybe<Scalars['String']>;
  zipCode?: Maybe<Scalars['String']>;
};

export type UserPostHistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  post: Post;
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
  Sre = 'SRE',
  Styrelsen = 'STYRELSEN'
}

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
  Access: ResolverTypeWrapper<Access>;
  AccessResource: ResolverTypeWrapper<AccessResource>;
  String: ResolverTypeWrapper<Scalars['String']>;
  AccessResourceType: AccessResourceType;
  AccessType: AccessType;
  Article: ResolverTypeWrapper<ArticleResponse>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  ArticleType: ArticleType;
  CasLoginResponse: ResolverTypeWrapper<CasLoginResponse>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  File: ResolverTypeWrapper<FileResponse>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  FileSystemResponse: ResolverTypeWrapper<Omit<FileSystemResponse, 'files'> & { files: Array<ResolversTypes['File']> }>;
  FileSystemResponsePath: ResolverTypeWrapper<FileSystemResponsePath>;
  FileType: FileType;
  HistoryEntry: ResolverTypeWrapper<HistoryEntry>;
  Me: ResolverTypeWrapper<Me>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Meeting: ResolverTypeWrapper<MeetingResponse>;
  MeetingDocumentType: MeetingDocumentType;
  MeetingType: MeetingType;
  ModifyArticle: ModifyArticle;
  ModifyPost: ModifyPost;
  Mutation: ResolverTypeWrapper<{}>;
  NewArticle: NewArticle;
  NewPost: NewPost;
  NewUser: NewUser;
  Post: ResolverTypeWrapper<Post>;
  PostType: PostType;
  Query: ResolverTypeWrapper<{}>;
  UpdateUser: UpdateUser;
  User: ResolverTypeWrapper<User>;
  UserPostHistoryEntry: ResolverTypeWrapper<UserPostHistoryEntry>;
  Utskott: Utskott;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Access: Access;
  AccessResource: AccessResource;
  String: Scalars['String'];
  Article: ArticleResponse;
  ID: Scalars['ID'];
  CasLoginResponse: CasLoginResponse;
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  File: FileResponse;
  Int: Scalars['Int'];
  FileSystemResponse: Omit<FileSystemResponse, 'files'> & { files: Array<ResolversParentTypes['File']> };
  FileSystemResponsePath: FileSystemResponsePath;
  HistoryEntry: HistoryEntry;
  Me: Me;
  Float: Scalars['Float'];
  Meeting: MeetingResponse;
  ModifyArticle: ModifyArticle;
  ModifyPost: ModifyPost;
  Mutation: {};
  NewArticle: NewArticle;
  NewPost: NewPost;
  NewUser: NewUser;
  Post: Post;
  Query: {};
  UpdateUser: UpdateUser;
  User: User;
  UserPostHistoryEntry: UserPostHistoryEntry;
}>;

export type AuthRequiredDirectiveArgs = {  };

export type AuthRequiredDirectiveResolver<Result, Parent, ContextType = Context, Args = AuthRequiredDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type WithPermissionsDirectiveArgs = {   roles: Array<Scalars['String']>; };

export type WithPermissionsDirectiveResolver<Result, Parent, ContextType = Context, Args = WithPermissionsDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Access'] = ResolversParentTypes['Access']> = ResolversObject<{
  doors?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  web?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AccessResourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AccessResource'] = ResolversParentTypes['AccessResource']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['AccessResourceType'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArticleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Article'] = ResolversParentTypes['Article']> = ResolversObject<{
  articleType?: Resolver<ResolversTypes['ArticleType'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  lastUpdatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastUpdatedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  signature?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CasLoginResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CasLoginResponse'] = ResolversParentTypes['CasLoginResponse']> = ResolversObject<{
  exists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type FileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File']> = ResolversObject<{
  accessType?: Resolver<ResolversTypes['AccessType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  folderLocation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['FileType'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FileSystemResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FileSystemResponse'] = ResolversParentTypes['FileSystemResponse']> = ResolversObject<{
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['FileSystemResponsePath']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FileSystemResponsePathResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FileSystemResponsePath'] = ResolversParentTypes['FileSystemResponsePath']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HistoryEntry'] = ResolversParentTypes['HistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  holder?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']> = ResolversObject<{
  accessExpiry?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  refreshExpiry?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MeetingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Meeting'] = ResolversParentTypes['Meeting']> = ResolversObject<{
  documents?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lateDocuments?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  summons?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MeetingType'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addAccessResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddAccessResourceArgs, 'name' | 'description' | 'resourceType'>>;
  addArticle?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<MutationAddArticleArgs, 'entry'>>;
  addFileToMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddFileToMeetingArgs, 'fileId' | 'fileType' | 'meetingId'>>;
  addMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddMeetingArgs, 'type'>>;
  addPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'period' | 'postname' | 'usernames'>>;
  casCreateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCasCreateUserArgs, 'hash' | 'input'>>;
  casLogin?: Resolver<ResolversTypes['CasLoginResponse'], ParentType, ContextType, RequireFields<MutationCasLoginArgs, 'token'>>;
  createFolder?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateFolderArgs, 'name' | 'path'>>;
  createUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'password' | 'username'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  modifyArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyArticleArgs, 'articleId' | 'entry'>>;
  modifyPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyPostArgs, 'info'>>;
  removeAccessResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveAccessResourceArgs, 'slug'>>;
  removeFileFromMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveFileFromMeetingArgs, 'fileType' | 'meetingId'>>;
  removeMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMeetingArgs, 'id'>>;
  removeUsersFromPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveUsersFromPostArgs, 'postname' | 'usernames'>>;
  requestPasswordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'username'>>;
  resetPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'password' | 'token' | 'username'>>;
  setIndividualAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetIndividualAccessArgs, 'access' | 'username'>>;
  setPostAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetPostAccessArgs, 'access' | 'postname'>>;
  updateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'input'>>;
  validatePasswordResetToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationValidatePasswordResetTokenArgs, 'token' | 'username'>>;
}>;

export type PostResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  history?: Resolver<Array<ResolversTypes['HistoryEntry']>, ParentType, ContextType>;
  interviewRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  postType?: Resolver<ResolversTypes['PostType'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  spots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  accessResource?: Resolver<ResolversTypes['AccessResource'], ParentType, ContextType, RequireFields<QueryAccessResourceArgs, 'slug'>>;
  accessResources?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType, RequireFields<QueryAccessResourcesArgs, never>>;
  article?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryArticleArgs, never>>;
  articles?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryArticlesArgs, never>>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileSystem?: Resolver<ResolversTypes['FileSystemResponse'], ParentType, ContextType, RequireFields<QueryFileSystemArgs, 'folder'>>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFilesArgs, never>>;
  individualAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  latestBoardMeetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryLatestBoardMeetingsArgs, never>>;
  latestnews?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryLatestnewsArgs, never>>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  meeting?: Resolver<Maybe<ResolversTypes['Meeting']>, ParentType, ContextType, RequireFields<QueryMeetingArgs, 'id'>>;
  meetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryMeetingsArgs, never>>;
  newsentries?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryNewsentriesArgs, never>>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'name'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postname'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, never>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  utskott?: Resolver<Maybe<ResolversTypes['Utskott']>, ParentType, ContextType, RequireFields<QueryUtskottArgs, never>>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  class?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isFuncUser?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  photoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  userPostHistory?: Resolver<Array<Maybe<ResolversTypes['UserPostHistoryEntry']>>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  zipCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPostHistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserPostHistoryEntry'] = ResolversParentTypes['UserPostHistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Access?: AccessResolvers<ContextType>;
  AccessResource?: AccessResourceResolvers<ContextType>;
  Article?: ArticleResolvers<ContextType>;
  CasLoginResponse?: CasLoginResponseResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  File?: FileResolvers<ContextType>;
  FileSystemResponse?: FileSystemResponseResolvers<ContextType>;
  FileSystemResponsePath?: FileSystemResponsePathResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
  Meeting?: MeetingResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPostHistoryEntry?: UserPostHistoryEntryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = Context> = ResolversObject<{
  authRequired?: AuthRequiredDirectiveResolver<any, any, ContextType>;
  withPermissions?: WithPermissionsDirectiveResolver<any, any, ContextType>;
}>;


/**
 * @deprecated
 * Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
 */
export type IDirectiveResolvers<ContextType = Context> = DirectiveResolvers<ContextType>;