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

export type Query = {
  accessResource: AccessResource;
  accessResources: Array<AccessResource>;
  article?: Maybe<Article>;
  articles: Array<Maybe<Article>>;
  electables: Array<Maybe<Post>>;
  file: File;
  fileSystem: FileSystemResponse;
  files: Array<File>;
  individualAccess?: Maybe<Access>;
  latestBoardMeetings: Array<Maybe<Meeting>>;
  latestElection?: Maybe<Election>;
  latestnews: Array<Maybe<Article>>;
  me?: Maybe<Me>;
  meeting?: Maybe<Meeting>;
  meetings: Array<Maybe<Meeting>>;
  newsentries: Array<Maybe<Article>>;
  nominations: Array<Maybe<Nomination>>;
  numberOfNominations: Scalars['Int'];
  openElection?: Maybe<Election>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  proposals: Array<Maybe<Proposal>>;
  searchFiles: Array<File>;
  searchUser: Array<User>;
  user?: Maybe<User>;
  utskott?: Maybe<Utskott>;
};


export type QueryAccessResourceArgs = {
  id: Scalars['Int'];
};


export type QueryAccessResourcesArgs = {
  type?: Maybe<AccessResourceType>;
};


export type QueryArticleArgs = {
  id?: Maybe<Scalars['ID']>;
  slug?: Maybe<Scalars['String']>;
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


export type QueryElectablesArgs = {
  electionId: Scalars['ID'];
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
  type?: Maybe<MeetingType>;
  number?: Maybe<Scalars['Int']>;
  year?: Maybe<Scalars['Int']>;
};


export type QueryNewsentriesArgs = {
  creator?: Maybe<Scalars['String']>;
  after?: Maybe<Scalars['DateTime']>;
  before?: Maybe<Scalars['DateTime']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


export type QueryNominationsArgs = {
  electionId: Scalars['ID'];
  postname?: Maybe<Scalars['String']>;
};


export type QueryNumberOfNominationsArgs = {
  electionId: Scalars['ID'];
  postname?: Maybe<Scalars['String']>;
};


export type QueryPostArgs = {
  name: Scalars['String'];
};


export type QueryPostAccessArgs = {
  postname: Scalars['String'];
};


export type QueryPostsArgs = {
  utskott?: Maybe<Utskott>;
  includeInactive: Scalars['Boolean'];
};


export type QueryProposalsArgs = {
  electionId: Scalars['ID'];
  postname?: Maybe<Scalars['String']>;
};


export type QuerySearchFilesArgs = {
  search: Scalars['String'];
};


export type QuerySearchUserArgs = {
  search: Scalars['String'];
};


export type QueryUserArgs = {
  username: Scalars['String'];
};


export type QueryUtskottArgs = {
  name?: Maybe<Scalars['String']>;
};

/** Access will be treated as a immutable object! */
export type Access = {
  doors: Array<AccessResource>;
  web: Array<AccessResource>;
};

export type Mutation = {
  activatePost: Scalars['Boolean'];
  addAccessResource: AccessResource;
  addArticle?: Maybe<Article>;
  addElectables: Scalars['Boolean'];
  addFileToMeeting: Scalars['Boolean'];
  addMeeting: Scalars['Boolean'];
  addPost: Scalars['Boolean'];
  addUsersToPost: Scalars['Boolean'];
  casCreateUser: Scalars['Boolean'];
  casLogin: CasLoginResponse;
  closeElection: Scalars['Boolean'];
  createElection: Scalars['Boolean'];
  createFolder: Scalars['Boolean'];
  createUser: Scalars['Boolean'];
  deactivatePost: Scalars['Boolean'];
  deleteFile: Scalars['Boolean'];
  /** Test user credentials and if valid get a jwt token */
  login?: Maybe<User>;
  logout?: Maybe<Scalars['Boolean']>;
  modifyArticle: Scalars['Boolean'];
  modifyPost: Scalars['Boolean'];
  nominate: Scalars['Boolean'];
  openElection: Scalars['Boolean'];
  propose: Scalars['Boolean'];
  removeAccessResource: Scalars['Boolean'];
  removeElectables: Scalars['Boolean'];
  removeFileFromMeeting: Scalars['Boolean'];
  removeMeeting: Scalars['Boolean'];
  removeUsersFromPost: Scalars['Boolean'];
  requestPasswordReset: Scalars['Boolean'];
  resetPassword: Scalars['Boolean'];
  respondToNomination: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
  updateUser: Scalars['Boolean'];
  validatePasswordResetToken: Scalars['Boolean'];
};


export type MutationActivatePostArgs = {
  postname: Scalars['String'];
};


export type MutationAddAccessResourceArgs = {
  name: Scalars['String'];
  description: Scalars['String'];
  resourceType: AccessResourceType;
};


export type MutationAddArticleArgs = {
  entry: NewArticle;
};


export type MutationAddElectablesArgs = {
  postnames?: Maybe<Array<Scalars['String']>>;
};


export type MutationAddFileToMeetingArgs = {
  meetingId: Scalars['ID'];
  fileId: Scalars['ID'];
  fileType: MeetingDocumentType;
};


export type MutationAddMeetingArgs = {
  type: MeetingType;
  number?: Maybe<Scalars['Int']>;
  year?: Maybe<Scalars['Int']>;
};


export type MutationAddPostArgs = {
  info: NewPost;
};


export type MutationAddUsersToPostArgs = {
  usernames: Array<Scalars['String']>;
  postname: Scalars['String'];
  period: Scalars['Int'];
};


export type MutationCasCreateUserArgs = {
  input: NewUser;
  hash: Scalars['String'];
};


export type MutationCasLoginArgs = {
  token: Scalars['String'];
};


export type MutationCreateElectionArgs = {
  electables: Array<Maybe<Scalars['String']>>;
  nominationsHidden: Scalars['Boolean'];
};


export type MutationCreateFolderArgs = {
  path: Scalars['String'];
  name: Scalars['String'];
};


export type MutationCreateUserArgs = {
  input: NewUser;
};


export type MutationDeactivatePostArgs = {
  postname: Scalars['String'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID'];
};


export type MutationLoginArgs = {
  username: Scalars['String'];
  password: Scalars['String'];
};


export type MutationModifyArticleArgs = {
  articleId: Scalars['Int'];
  entry: ModifyArticle;
};


export type MutationModifyPostArgs = {
  info: ModifyPost;
};


export type MutationNominateArgs = {
  electionId: Scalars['ID'];
  username: Scalars['String'];
  postname: Scalars['String'];
};


export type MutationOpenElectionArgs = {
  electionId: Scalars['ID'];
};


export type MutationProposeArgs = {
  electionId: Scalars['ID'];
  username: Scalars['String'];
  postname: Scalars['String'];
};


export type MutationRemoveAccessResourceArgs = {
  id: Scalars['Int'];
};


export type MutationRemoveElectablesArgs = {
  postnames?: Maybe<Array<Scalars['String']>>;
};


export type MutationRemoveFileFromMeetingArgs = {
  meetingId: Scalars['ID'];
  fileType: MeetingDocumentType;
};


export type MutationRemoveMeetingArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUsersFromPostArgs = {
  usernames: Array<Scalars['String']>;
  postname: Scalars['String'];
};


export type MutationRequestPasswordResetArgs = {
  username: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  username: Scalars['String'];
  token: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRespondToNominationArgs = {
  electionId: Scalars['ID'];
  username: Scalars['String'];
  postname: Scalars['String'];
  accepts: Scalars['Boolean'];
};


export type MutationSetIndividualAccessArgs = {
  username: Scalars['String'];
  access: Array<Scalars['Int']>;
};


export type MutationSetPostAccessArgs = {
  postname: Scalars['String'];
  access: Array<Scalars['Int']>;
};


export type MutationUpdateUserArgs = {
  input: UpdateUser;
};


export type MutationValidatePasswordResetTokenArgs = {
  username: Scalars['String'];
  token: Scalars['String'];
};

export type AccessResource = {
  description: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  resourceType: AccessResourceType;
};

export enum AccessResourceType {
  Door = 'DOOR',
  Web = 'WEB'
}



/** Body is saved as HTML serverside, but edited in MarkDown */
export type Article = {
  id?: Maybe<Scalars['ID']>;
  slug?: Maybe<Scalars['String']>;
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
  Sre = 'SRE',
  Styrelsen = 'STYRELSEN'
}

export type UserPostHistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  post: Post;
  start: Scalars['Date'];
};

export type CasLoginResponse = {
  username: Scalars['String'];
  hash?: Maybe<Scalars['String']>;
  exists: Scalars['Boolean'];
};

export type Election = {
  id: Scalars['ID'];
  creator: User;
  createdAt: Scalars['DateTime'];
  openedAt?: Maybe<Scalars['DateTime']>;
  closedAt?: Maybe<Scalars['DateTime']>;
  open: Scalars['Boolean'];
  /** Which posts can be elected in the election */
  electables: Array<Maybe<Post>>;
  /** Whether the nominations and their responses are anonymous */
  nominationsHidden: Scalars['Boolean'];
};

export type Nomination = {
  user: User;
  post: Post;
  /**
   * If this nomination has been accepted,
   * `null` means no response has been given yet
   */
  accepted?: Maybe<Scalars['Boolean']>;
};

export type Proposal = {
  user: User;
  post: Post;
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

export enum AccessType {
  Admin = 'admin',
  Authenticated = 'authenticated',
  Public = 'public'
}

export type FileSystemResponsePath = {
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type Meeting = {
  id: Scalars['ID'];
  name: Scalars['String'];
  type: MeetingType;
  /**
   * Styrelse- och extrainsatta möten har nummer efter hur många
   * som varit det året (börjar på 1). VM/VTM/HTM får också
   * för enkelhetens skull
   */
  number: Scalars['Int'];
  year: Scalars['Int'];
  /** Kallelse */
  summons?: Maybe<File>;
  /** Handlingar */
  documents?: Maybe<File>;
  lateDocuments?: Maybe<File>;
  protocol?: Maybe<File>;
};

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

export enum MeetingDocumentType {
  /** Kallelse */
  Summons = 'summons',
  /** Handlingar */
  Documents = 'documents',
  LateDocuments = 'lateDocuments',
  Protocol = 'protocol'
}

export type NewPost = {
  name: Scalars['String'];
  utskott: Utskott;
  postType: PostType;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: Maybe<Scalars['Int']>;
  description?: Maybe<Scalars['String']>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
};

export type ModifyPost = {
  name: Scalars['String'];
  utskott?: Maybe<Utskott>;
  postType?: Maybe<PostType>;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: Maybe<Scalars['Int']>;
  description?: Maybe<Scalars['String']>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
};

export type Me = {
  user?: Maybe<User>;
  accessExpiry: Scalars['Float'];
  refreshExpiry: Scalars['Float'];
};

export type NewUser = {
  username: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  class: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  password: Scalars['String'];
  isFuncUser?: Maybe<Scalars['Boolean']>;
};

export type UpdateUser = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  zipCode?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
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
  Int: ResolverTypeWrapper<Scalars['Int']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Access: ResolverTypeWrapper<Access>;
  Mutation: ResolverTypeWrapper<{}>;
  AccessResource: ResolverTypeWrapper<AccessResource>;
  AccessResourceType: AccessResourceType;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Article: ResolverTypeWrapper<ArticleResponse>;
  NewArticle: NewArticle;
  ModifyArticle: ModifyArticle;
  ArticleType: ArticleType;
  User: ResolverTypeWrapper<User>;
  Post: ResolverTypeWrapper<Post>;
  PostType: PostType;
  HistoryEntry: ResolverTypeWrapper<HistoryEntry>;
  Utskott: Utskott;
  UserPostHistoryEntry: ResolverTypeWrapper<UserPostHistoryEntry>;
  CasLoginResponse: ResolverTypeWrapper<CasLoginResponse>;
  Election: ResolverTypeWrapper<Election>;
  Nomination: ResolverTypeWrapper<Nomination>;
  Proposal: ResolverTypeWrapper<Proposal>;
  FileType: FileType;
  File: ResolverTypeWrapper<FileResponse>;
  FileSystemResponse: ResolverTypeWrapper<Omit<FileSystemResponse, 'files'> & { files: Array<ResolversTypes['File']> }>;
  AccessType: AccessType;
  FileSystemResponsePath: ResolverTypeWrapper<FileSystemResponsePath>;
  Meeting: ResolverTypeWrapper<MeetingResponse>;
  MeetingType: MeetingType;
  MeetingDocumentType: MeetingDocumentType;
  NewPost: NewPost;
  ModifyPost: ModifyPost;
  Me: ResolverTypeWrapper<Me>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  NewUser: NewUser;
  UpdateUser: UpdateUser;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  Int: Scalars['Int'];
  ID: Scalars['ID'];
  String: Scalars['String'];
  Boolean: Scalars['Boolean'];
  Access: Access;
  Mutation: {};
  AccessResource: AccessResource;
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  Article: ArticleResponse;
  NewArticle: NewArticle;
  ModifyArticle: ModifyArticle;
  User: User;
  Post: Post;
  HistoryEntry: HistoryEntry;
  UserPostHistoryEntry: UserPostHistoryEntry;
  CasLoginResponse: CasLoginResponse;
  Election: Election;
  Nomination: Nomination;
  Proposal: Proposal;
  File: FileResponse;
  FileSystemResponse: Omit<FileSystemResponse, 'files'> & { files: Array<ResolversParentTypes['File']> };
  FileSystemResponsePath: FileSystemResponsePath;
  Meeting: MeetingResponse;
  NewPost: NewPost;
  ModifyPost: ModifyPost;
  Me: Me;
  Float: Scalars['Float'];
  NewUser: NewUser;
  UpdateUser: UpdateUser;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  accessResource?: Resolver<ResolversTypes['AccessResource'], ParentType, ContextType, RequireFields<QueryAccessResourceArgs, 'id'>>;
  accessResources?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType, RequireFields<QueryAccessResourcesArgs, never>>;
  article?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryArticleArgs, never>>;
  articles?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryArticlesArgs, never>>;
  electables?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType, RequireFields<QueryElectablesArgs, 'electionId'>>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileSystem?: Resolver<ResolversTypes['FileSystemResponse'], ParentType, ContextType, RequireFields<QueryFileSystemArgs, 'folder'>>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFilesArgs, never>>;
  individualAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  latestBoardMeetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryLatestBoardMeetingsArgs, never>>;
  latestElection?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType>;
  latestnews?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryLatestnewsArgs, never>>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  meeting?: Resolver<Maybe<ResolversTypes['Meeting']>, ParentType, ContextType, RequireFields<QueryMeetingArgs, 'id'>>;
  meetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryMeetingsArgs, never>>;
  newsentries?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryNewsentriesArgs, never>>;
  nominations?: Resolver<Array<Maybe<ResolversTypes['Nomination']>>, ParentType, ContextType, RequireFields<QueryNominationsArgs, 'electionId'>>;
  numberOfNominations?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfNominationsArgs, 'electionId'>>;
  openElection?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'name'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postname'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, 'includeInactive'>>;
  proposals?: Resolver<Array<Maybe<ResolversTypes['Proposal']>>, ParentType, ContextType, RequireFields<QueryProposalsArgs, 'electionId'>>;
  searchFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QuerySearchFilesArgs, 'search'>>;
  searchUser?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QuerySearchUserArgs, 'search'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  utskott?: Resolver<Maybe<ResolversTypes['Utskott']>, ParentType, ContextType, RequireFields<QueryUtskottArgs, never>>;
}>;

export type AccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Access'] = ResolversParentTypes['Access']> = ResolversObject<{
  doors?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  web?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  activatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationActivatePostArgs, 'postname'>>;
  addAccessResource?: Resolver<ResolversTypes['AccessResource'], ParentType, ContextType, RequireFields<MutationAddAccessResourceArgs, 'name' | 'description' | 'resourceType'>>;
  addArticle?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<MutationAddArticleArgs, 'entry'>>;
  addElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddElectablesArgs, never>>;
  addFileToMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddFileToMeetingArgs, 'meetingId' | 'fileId' | 'fileType'>>;
  addMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddMeetingArgs, 'type'>>;
  addPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'usernames' | 'postname' | 'period'>>;
  casCreateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCasCreateUserArgs, 'input' | 'hash'>>;
  casLogin?: Resolver<ResolversTypes['CasLoginResponse'], ParentType, ContextType, RequireFields<MutationCasLoginArgs, 'token'>>;
  closeElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateElectionArgs, 'electables' | 'nominationsHidden'>>;
  createFolder?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateFolderArgs, 'path' | 'name'>>;
  createUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deactivatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeactivatePostArgs, 'postname'>>;
  deleteFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'username' | 'password'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  modifyArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyArticleArgs, 'articleId' | 'entry'>>;
  modifyPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyPostArgs, 'info'>>;
  nominate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationNominateArgs, 'electionId' | 'username' | 'postname'>>;
  openElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationOpenElectionArgs, 'electionId'>>;
  propose?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationProposeArgs, 'electionId' | 'username' | 'postname'>>;
  removeAccessResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveAccessResourceArgs, 'id'>>;
  removeElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveElectablesArgs, never>>;
  removeFileFromMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveFileFromMeetingArgs, 'meetingId' | 'fileType'>>;
  removeMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMeetingArgs, 'id'>>;
  removeUsersFromPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveUsersFromPostArgs, 'usernames' | 'postname'>>;
  requestPasswordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'username'>>;
  resetPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'username' | 'token' | 'password'>>;
  respondToNomination?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRespondToNominationArgs, 'electionId' | 'username' | 'postname' | 'accepts'>>;
  setIndividualAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetIndividualAccessArgs, 'username' | 'access'>>;
  setPostAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetPostAccessArgs, 'postname' | 'access'>>;
  updateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'input'>>;
  validatePasswordResetToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationValidatePasswordResetTokenArgs, 'username' | 'token'>>;
}>;

export type AccessResourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AccessResource'] = ResolversParentTypes['AccessResource']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['AccessResourceType'], ParentType, ContextType>;
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
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type HistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HistoryEntry'] = ResolversParentTypes['HistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  holder?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPostHistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserPostHistoryEntry'] = ResolversParentTypes['UserPostHistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CasLoginResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CasLoginResponse'] = ResolversParentTypes['CasLoginResponse']> = ResolversObject<{
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  exists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ElectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Election'] = ResolversParentTypes['Election']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  openedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  closedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  open?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  electables?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType>;
  nominationsHidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NominationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Nomination'] = ResolversParentTypes['Nomination']> = ResolversObject<{
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  accepted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProposalResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Proposal'] = ResolversParentTypes['Proposal']> = ResolversObject<{
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

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

export type MeetingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Meeting'] = ResolversParentTypes['Meeting']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MeetingType'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  summons?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  documents?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  lateDocuments?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']> = ResolversObject<{
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  accessExpiry?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  refreshExpiry?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Access?: AccessResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  AccessResource?: AccessResourceResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  Article?: ArticleResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
  UserPostHistoryEntry?: UserPostHistoryEntryResolvers<ContextType>;
  CasLoginResponse?: CasLoginResponseResolvers<ContextType>;
  Election?: ElectionResolvers<ContextType>;
  Nomination?: NominationResolvers<ContextType>;
  Proposal?: ProposalResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FileSystemResponse?: FileSystemResponseResolvers<ContextType>;
  FileSystemResponsePath?: FileSystemResponsePathResolvers<ContextType>;
  Meeting?: MeetingResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
