import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ArticleResponse, FileResponse, MeetingResponse, ElectionResponse, ProposalResponse, NominationResponse, HeheResponse, ApiKeyResponse } from '../mappers';
import type { Context } from '../context';
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
  DateTime: Date;
  Object: Record<string, string>;
};

/** Access will be treated as a immutable object! */
export type Access = {
  doors: Array<Door>;
  features: Array<Feature>;
};

export type AccessInput = {
  doors: Array<Door>;
  features: Array<Feature>;
};

export enum AccessResourceType {
  Door = 'door',
  Feature = 'feature'
}

export enum AccessType {
  Admin = 'ADMIN',
  Authenticated = 'AUTHENTICATED',
  Public = 'PUBLIC'
}

export type ApiKey = {
  access: Access;
  creator: User;
  description: Scalars['String'];
  key: Scalars['String'];
};

/** Body is saved as HTML serversInte, but edited in MarkDown */
export type Article = {
  articleType: ArticleType;
  author: User;
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['Int'];
  lastUpdatedAt: Scalars['DateTime'];
  lastUpdatedBy: User;
  signature: Scalars['String'];
  /** Used in URLs, but Intentification is done using only tail (Int) */
  slug?: Maybe<Scalars['String']>;
  tags: Array<Scalars['String']>;
  title: Scalars['String'];
};

/** News are the ones to be used by a website newsreel */
export enum ArticleType {
  Information = 'INFORMATION',
  News = 'NEWS'
}

export type CasLoginResponse = {
  exists: Scalars['Boolean'];
  hash?: Maybe<Scalars['String']>;
  username: Scalars['String'];
};



/** This represets all doors that E-sektionen own */
export enum Door {
  Arkivet = 'arkivet',
  Bd = 'bd',
  Biljard = 'biljard',
  Cm = 'cm',
  Ekea = 'ekea',
  Hk = 'hk',
  Km = 'km',
  Led = 'led',
  Pa = 'pa',
  Pump = 'pump',
  Sikrit = 'sikrit',
  Ulla = 'ulla'
}

export type DoorInfo = {
  description: Scalars['String'];
  name: Door;
};

export type Election = {
  /** Is only available if `nominationsHidden` is `false` */
  acceptedNominations?: Maybe<Array<Maybe<Nomination>>>;
  closedAt?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  creator: User;
  /** Which posts can be elected in the election */
  electables: Array<Maybe<Post>>;
  id: Scalars['Int'];
  /** Whether accepted nominations are to be hidden */
  nominationsHidden: Scalars['Boolean'];
  open: Scalars['Boolean'];
  openedAt?: Maybe<Scalars['DateTime']>;
  proposals?: Maybe<Array<Maybe<Proposal>>>;
};

export type EmergencyContact = {
  id: Scalars['Int'];
  name: Scalars['String'];
  phone: Scalars['String'];
  type: EmergencyContactType;
};

export enum EmergencyContactType {
  Brother = 'BROTHER',
  Dad = 'DAD',
  Mom = 'MOM',
  Other = 'OTHER',
  SignificantOther = 'SIGNIFICANT_OTHER',
  Sister = 'SISTER'
}

/** Features are used for mapping access to a feature (ex article or election) for user or a post. This is not limited to efterphest */
export enum Feature {
  AccessAdmin = 'access_admin',
  ArticleEditor = 'article_editor',
  ElectionAdmin = 'election_admin',
  EmailAdmin = 'email_admin',
  FilesAdmin = 'files_admin',
  HeheAdmin = 'hehe_admin',
  MeetingsAdmin = 'meetings_admin',
  NewsEditor = 'news_editor',
  PostAdmin = 'post_admin',
  Superadmin = 'superadmin',
  UserAdmin = 'user_admin'
}

export type FeatureInfo = {
  description: Scalars['String'];
  name: Feature;
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
  Code = 'CODE',
  Folder = 'FOLDER',
  Image = 'IMAGE',
  Other = 'OTHER',
  Pdf = 'PDF',
  Powerpoint = 'POWERPOINT',
  Spreadsheet = 'SPREADSHEET',
  Text = 'TEXT'
}

export type GroupedPost = {
  posts: Array<Post>;
  utskott: Utskott;
};

export type Hehe = {
  file: File;
  number: Scalars['Int'];
  uploader: User;
  year: Scalars['Int'];
};

export type HistoryEntry = {
  end?: Maybe<Scalars['Date']>;
  holder: User;
  id: Scalars['Int'];
  start: Scalars['Date'];
};

export type LoginProvider = {
  email?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  provider: Scalars['String'];
  token: Scalars['String'];
};

export type LoginResponse = {
  accessToken: Scalars['String'];
  refreshToken: Scalars['String'];
  user: User;
};

export type Meeting = {
  /** Bilaga */
  appendix?: Maybe<File>;
  /** Handlingar */
  documents?: Maybe<File>;
  id: Scalars['Int'];
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
  /** Bilaga */
  Appendix = 'appendix',
  /** Handlingar */
  Documents = 'documents',
  LateDocuments = 'lateDocuments',
  Protocol = 'protocol',
  /** Kallelse */
  Summons = 'summons'
}

export enum MeetingType {
  /** Extrainsatt Sektionsmöte */
  Extra = 'Extra',
  /** Höstterminsmöte */
  Htm = 'HTM',
  /** Styrelsemöte */
  Sm = 'SM',
  /** Valmöte */
  Vm = 'VM',
  /** Vårterminsmöte */
  Vtm = 'VTM'
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
  id: Scalars['Int'];
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
  postType?: Maybe<PostType>;
  postname?: Maybe<Scalars['String']>;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: Maybe<Scalars['Int']>;
  utskott?: Maybe<Utskott>;
};

export type Mutation = {
  activatePost: Scalars['Boolean'];
  addArticle: Article;
  addElectables: Scalars['Boolean'];
  addEmergencyContact: EmergencyContact;
  addFileToMeeting: Scalars['Boolean'];
  addHehe: Scalars['Boolean'];
  addMeeting: Meeting;
  addPost: Post;
  addUsersToPost: Scalars['Boolean'];
  casCreateUser: User;
  casLogin: CasLoginResponse;
  closeElection: Scalars['Boolean'];
  createApiKey: Scalars['String'];
  createElection: Election;
  createFolder: File;
  createUser: User;
  deactivatePost: Scalars['Boolean'];
  deleteApiKey: Scalars['Boolean'];
  deleteFile: Scalars['Boolean'];
  issueTokens: TokenResponse;
  linkLoginProvider: LoginProvider;
  /** Test user credentials and if valid get a jwt token */
  login: LoginResponse;
  logout: Scalars['Boolean'];
  modifyArticle: Article;
  modifyPost: Scalars['Boolean'];
  /** Only possible during open election, so electionId is known */
  nominate: Scalars['Boolean'];
  openElection: Scalars['Boolean'];
  propose: Scalars['Boolean'];
  providerLogin: LoginResponse;
  refresh: TokenResponse;
  removeArticle: Scalars['Boolean'];
  removeElectables: Scalars['Boolean'];
  removeEmergencyContact: Scalars['Boolean'];
  removeFileFromMeeting: Scalars['Boolean'];
  removeHehe: Scalars['Boolean'];
  removeHistoryEntry: Scalars['Boolean'];
  removeMeeting: Scalars['Boolean'];
  removeProposal: Scalars['Boolean'];
  requestPasswordReset: Scalars['Boolean'];
  resetPassword: Scalars['Boolean'];
  /** Only possible during open election, so electionId is known */
  respondToNomination: Scalars['Boolean'];
  sendEmail: Scalars['Boolean'];
  setApiKeyAccess: Scalars['Boolean'];
  setElectables: Scalars['Boolean'];
  setHiddenNominations: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
  setUserPostEnd: Scalars['Boolean'];
  unlinkLoginProvider: Scalars['Boolean'];
  updateUser: User;
  validatePasswordResetToken: Scalars['Boolean'];
  validateToken: Scalars['Boolean'];
};


export type MutationActivatePostArgs = {
  id: Scalars['Int'];
};


export type MutationAddArticleArgs = {
  entry: NewArticle;
};


export type MutationAddElectablesArgs = {
  electionId: Scalars['Int'];
  postIds?: Maybe<Array<Scalars['Int']>>;
};


export type MutationAddEmergencyContactArgs = {
  name: Scalars['String'];
  phone: Scalars['String'];
  type: EmergencyContactType;
};


export type MutationAddFileToMeetingArgs = {
  fileId: Scalars['String'];
  fileType: MeetingDocumentType;
  meetingId: Scalars['Int'];
};


export type MutationAddHeheArgs = {
  fileId: Scalars['ID'];
  number: Scalars['Int'];
  year: Scalars['Int'];
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
  end?: Maybe<Scalars['Date']>;
  id: Scalars['Int'];
  start?: Maybe<Scalars['Date']>;
  usernames: Array<Scalars['String']>;
};


export type MutationCasCreateUserArgs = {
  hash: Scalars['String'];
  input: NewUser;
};


export type MutationCasLoginArgs = {
  token: Scalars['String'];
};


export type MutationCreateApiKeyArgs = {
  description: Scalars['String'];
};


export type MutationCreateElectionArgs = {
  electables: Array<Scalars['Int']>;
  nominationsHidden: Scalars['Boolean'];
};


export type MutationCreateFolderArgs = {
  name: Scalars['String'];
  path: Scalars['String'];
};


export type MutationCreateUserArgs = {
  input: NewUser;
};


export type MutationDeactivatePostArgs = {
  id: Scalars['Int'];
};


export type MutationDeleteApiKeyArgs = {
  key: Scalars['String'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID'];
};


export type MutationIssueTokensArgs = {
  username: Scalars['String'];
};


export type MutationLinkLoginProviderArgs = {
  input: ProviderOptions;
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


export type MutationNominateArgs = {
  postIds: Array<Scalars['Int']>;
  username: Scalars['String'];
};


export type MutationOpenElectionArgs = {
  electionId: Scalars['Int'];
};


export type MutationProposeArgs = {
  electionId: Scalars['Int'];
  postId: Scalars['Int'];
  username: Scalars['String'];
};


export type MutationProviderLoginArgs = {
  input: ProviderOptions;
};


export type MutationRefreshArgs = {
  refreshToken: Scalars['String'];
};


export type MutationRemoveArticleArgs = {
  articleId: Scalars['Int'];
};


export type MutationRemoveElectablesArgs = {
  electionId: Scalars['Int'];
  postIds?: Maybe<Array<Scalars['Int']>>;
};


export type MutationRemoveEmergencyContactArgs = {
  id: Scalars['Int'];
};


export type MutationRemoveFileFromMeetingArgs = {
  fileType: MeetingDocumentType;
  meetingId: Scalars['Int'];
};


export type MutationRemoveHeheArgs = {
  number: Scalars['Int'];
  year: Scalars['Int'];
};


export type MutationRemoveHistoryEntryArgs = {
  id: Scalars['Int'];
};


export type MutationRemoveMeetingArgs = {
  id: Scalars['Int'];
};


export type MutationRemoveProposalArgs = {
  electionId: Scalars['Int'];
  postId: Scalars['Int'];
  username: Scalars['String'];
};


export type MutationRequestPasswordResetArgs = {
  username: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  password: Scalars['String'];
  token: Scalars['String'];
  username: Scalars['String'];
};


export type MutationRespondToNominationArgs = {
  accepts: NominationAnswer;
  postId: Scalars['Int'];
};


export type MutationSendEmailArgs = {
  options: SendEmailOptions;
};


export type MutationSetApiKeyAccessArgs = {
  access: AccessInput;
  key: Scalars['String'];
};


export type MutationSetElectablesArgs = {
  electionId: Scalars['Int'];
  postIds: Array<Scalars['Int']>;
};


export type MutationSetHiddenNominationsArgs = {
  electionId: Scalars['Int'];
  hidden: Scalars['Boolean'];
};


export type MutationSetIndividualAccessArgs = {
  access: AccessInput;
  username: Scalars['String'];
};


export type MutationSetPostAccessArgs = {
  access: AccessInput;
  postId: Scalars['Int'];
};


export type MutationSetUserPostEndArgs = {
  end: Scalars['Date'];
  id: Scalars['Int'];
};


export type MutationUnlinkLoginProviderArgs = {
  id: Scalars['Int'];
};


export type MutationUpdateUserArgs = {
  input: UpdateUser;
};


export type MutationValidatePasswordResetTokenArgs = {
  token: Scalars['String'];
  username: Scalars['String'];
};


export type MutationValidateTokenArgs = {
  token: Scalars['String'];
};

export type NewArticle = {
  articleType: ArticleType;
  body: Scalars['String'];
  signature: Scalars['String'];
  tags: Array<Scalars['String']>;
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
  lastName: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};

export type Nomination = {
  answer: NominationAnswer;
  post: Post;
  user: User;
};

export enum NominationAnswer {
  No = 'NO',
  NotAnswered = 'NOT_ANSWERED',
  Yes = 'YES'
}


export type Post = {
  access: Access;
  active: Scalars['Boolean'];
  description: Scalars['String'];
  history: Array<HistoryEntry>;
  id: Scalars['Int'];
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

export type PostHolder = {
  holder: User;
  post: Post;
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

/** Valberedningens förslag */
export type Proposal = {
  post: Post;
  user: User;
};

export type ProviderOptions = {
  email?: Maybe<Scalars['String']>;
  provider: Scalars['String'];
  token: Scalars['String'];
};

/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type Query = {
  apiKey: ApiKey;
  apiKeys: Array<ApiKey>;
  article: Article;
  articles: Array<Article>;
  currentPostHolders: Array<PostHolder>;
  doors: Array<DoorInfo>;
  election?: Maybe<Election>;
  elections: Array<Maybe<Election>>;
  features: Array<FeatureInfo>;
  file: File;
  fileSystem: FileSystemResponse;
  files: Array<File>;
  groupedPosts: Array<Maybe<GroupedPost>>;
  hehe?: Maybe<Hehe>;
  hehes: Array<Maybe<Hehe>>;
  /** Used if nominations are hidden but an election-admin wants too see nominations */
  hiddenNominations: Array<Maybe<Nomination>>;
  individualAccess?: Maybe<Access>;
  latestBoardMeetings: Array<Maybe<Meeting>>;
  latestElections: Array<Maybe<Election>>;
  latestHehe: Array<Maybe<Hehe>>;
  latestnews: Array<Article>;
  me: User;
  meeting?: Maybe<Meeting>;
  meetings: Array<Maybe<Meeting>>;
  /** A users own nominations should always be available to them */
  myNominations: Array<Maybe<Nomination>>;
  newsentries: Array<Article>;
  numberOfMembers: Scalars['Int'];
  numberOfNominations: Scalars['Int'];
  numberOfProposals: Scalars['Int'];
  numberOfVolunteers: Scalars['Int'];
  openElection?: Maybe<Election>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  searchFiles: Array<File>;
  searchUser: Array<User>;
  user: User;
  utskott?: Maybe<Utskott>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryApiKeyArgs = {
  key: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryArticleArgs = {
  id?: Maybe<Scalars['Int']>;
  slug?: Maybe<Scalars['String']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryArticlesArgs = {
  author?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['Int']>;
  tags?: Maybe<Array<Scalars['String']>>;
  type?: Maybe<ArticleType>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryCurrentPostHoldersArgs = {
  includeInactive: Scalars['Boolean'];
  postIds?: Maybe<Array<Scalars['Int']>>;
  utskott?: Maybe<Utskott>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryElectionArgs = {
  electionId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryElectionsArgs = {
  electionIds: Array<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryFileArgs = {
  id: Scalars['ID'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryFileSystemArgs = {
  folder: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryFilesArgs = {
  type?: Maybe<FileType>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryGroupedPostsArgs = {
  includeInactive: Scalars['Boolean'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryHeheArgs = {
  number: Scalars['Int'];
  year: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryHehesArgs = {
  year: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryHiddenNominationsArgs = {
  answer?: Maybe<NominationAnswer>;
  electionId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryIndividualAccessArgs = {
  username: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestBoardMeetingsArgs = {
  limit?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestElectionsArgs = {
  includeHiddenNominations?: Maybe<Scalars['Boolean']>;
  includeUnopened?: Maybe<Scalars['Boolean']>;
  limit?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestHeheArgs = {
  limit?: Maybe<Scalars['Int']>;
  sortOrder?: Maybe<SortOrder>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestnewsArgs = {
  limit?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryMeetingArgs = {
  id: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryMeetingsArgs = {
  number?: Maybe<Scalars['Int']>;
  type?: Maybe<MeetingType>;
  year?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryMyNominationsArgs = {
  answer?: Maybe<NominationAnswer>;
  electionId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNewsentriesArgs = {
  after?: Maybe<Scalars['DateTime']>;
  author?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['DateTime']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfNominationsArgs = {
  electionId: Scalars['Int'];
  postId?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfProposalsArgs = {
  electionId: Scalars['Int'];
  postId?: Maybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfVolunteersArgs = {
  date?: Maybe<Scalars['Date']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryPostArgs = {
  id: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryPostAccessArgs = {
  postId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryPostsArgs = {
  includeInactive: Scalars['Boolean'];
  utskott?: Maybe<Utskott>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QuerySearchFilesArgs = {
  search: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QuerySearchUserArgs = {
  search: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryUserArgs = {
  username: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryUtskottArgs = {
  name?: Maybe<Scalars['String']>;
};

export type SendEmailOptions = {
  body?: Maybe<Scalars['String']>;
  overrides?: Maybe<Scalars['Object']>;
  subject: Scalars['String'];
  template?: Maybe<Scalars['String']>;
  to: Array<Scalars['String']>;
};

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export type TokenResponse = {
  accessToken: Scalars['String'];
  refreshToken: Scalars['String'];
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
  emergencyContacts: Array<EmergencyContact>;
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  loginProviders: Array<Maybe<LoginProvider>>;
  phone?: Maybe<Scalars['String']>;
  photoUrl?: Maybe<Scalars['String']>;
  /** Currents posts held by this user */
  posts: Array<Post>;
  /** Past and current posts held by this user */
  userPostHistory: Array<Maybe<UserPostHistoryEntry>>;
  username: Scalars['String'];
  website?: Maybe<Scalars['String']>;
  wikiEdits: Scalars['Int'];
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
  AccessInput: AccessInput;
  AccessResourceType: AccessResourceType;
  AccessType: AccessType;
  ApiKey: ResolverTypeWrapper<ApiKeyResponse>;
  Article: ResolverTypeWrapper<ArticleResponse>;
  ArticleType: ArticleType;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CasLoginResponse: ResolverTypeWrapper<CasLoginResponse>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Door: Door;
  DoorInfo: ResolverTypeWrapper<DoorInfo>;
  Election: ResolverTypeWrapper<ElectionResponse>;
  EmergencyContact: ResolverTypeWrapper<EmergencyContact>;
  EmergencyContactType: EmergencyContactType;
  Feature: Feature;
  FeatureInfo: ResolverTypeWrapper<FeatureInfo>;
  File: ResolverTypeWrapper<FileResponse>;
  FileSystemResponse: ResolverTypeWrapper<Omit<FileSystemResponse, 'files'> & { files: Array<ResolversTypes['File']> }>;
  FileSystemResponsePath: ResolverTypeWrapper<FileSystemResponsePath>;
  FileType: FileType;
  GroupedPost: ResolverTypeWrapper<GroupedPost>;
  Hehe: ResolverTypeWrapper<HeheResponse>;
  HistoryEntry: ResolverTypeWrapper<HistoryEntry>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  LoginProvider: ResolverTypeWrapper<LoginProvider>;
  LoginResponse: ResolverTypeWrapper<LoginResponse>;
  Meeting: ResolverTypeWrapper<MeetingResponse>;
  MeetingDocumentType: MeetingDocumentType;
  MeetingType: MeetingType;
  ModifyArticle: ModifyArticle;
  ModifyPost: ModifyPost;
  Mutation: ResolverTypeWrapper<{}>;
  NewArticle: NewArticle;
  NewPost: NewPost;
  NewUser: NewUser;
  Nomination: ResolverTypeWrapper<NominationResponse>;
  NominationAnswer: NominationAnswer;
  Object: ResolverTypeWrapper<Scalars['Object']>;
  Post: ResolverTypeWrapper<Post>;
  PostHolder: ResolverTypeWrapper<PostHolder>;
  PostType: PostType;
  Proposal: ResolverTypeWrapper<ProposalResponse>;
  ProviderOptions: ProviderOptions;
  Query: ResolverTypeWrapper<{}>;
  SendEmailOptions: SendEmailOptions;
  SortOrder: SortOrder;
  String: ResolverTypeWrapper<Scalars['String']>;
  TokenResponse: ResolverTypeWrapper<TokenResponse>;
  UpdateUser: UpdateUser;
  User: ResolverTypeWrapper<User>;
  UserPostHistoryEntry: ResolverTypeWrapper<UserPostHistoryEntry>;
  Utskott: Utskott;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Access: Access;
  AccessInput: AccessInput;
  ApiKey: ApiKeyResponse;
  Article: ArticleResponse;
  Boolean: Scalars['Boolean'];
  CasLoginResponse: CasLoginResponse;
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  DoorInfo: DoorInfo;
  Election: ElectionResponse;
  EmergencyContact: EmergencyContact;
  FeatureInfo: FeatureInfo;
  File: FileResponse;
  FileSystemResponse: Omit<FileSystemResponse, 'files'> & { files: Array<ResolversParentTypes['File']> };
  FileSystemResponsePath: FileSystemResponsePath;
  GroupedPost: GroupedPost;
  Hehe: HeheResponse;
  HistoryEntry: HistoryEntry;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  LoginProvider: LoginProvider;
  LoginResponse: LoginResponse;
  Meeting: MeetingResponse;
  ModifyArticle: ModifyArticle;
  ModifyPost: ModifyPost;
  Mutation: {};
  NewArticle: NewArticle;
  NewPost: NewPost;
  NewUser: NewUser;
  Nomination: NominationResponse;
  Object: Scalars['Object'];
  Post: Post;
  PostHolder: PostHolder;
  Proposal: ProposalResponse;
  ProviderOptions: ProviderOptions;
  Query: {};
  SendEmailOptions: SendEmailOptions;
  String: Scalars['String'];
  TokenResponse: TokenResponse;
  UpdateUser: UpdateUser;
  User: User;
  UserPostHistoryEntry: UserPostHistoryEntry;
}>;

export type AccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Access'] = ResolversParentTypes['Access']> = ResolversObject<{
  doors?: Resolver<Array<ResolversTypes['Door']>, ParentType, ContextType>;
  features?: Resolver<Array<ResolversTypes['Feature']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiKeyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArticleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Article'] = ResolversParentTypes['Article']> = ResolversObject<{
  articleType?: Resolver<ResolversTypes['ArticleType'], ParentType, ContextType>;
  author?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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

export type DoorInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DoorInfo'] = ResolversParentTypes['DoorInfo']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['Door'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ElectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Election'] = ResolversParentTypes['Election']> = ResolversObject<{
  acceptedNominations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Nomination']>>>, ParentType, ContextType>;
  closedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  electables?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  nominationsHidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  openedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  proposals?: Resolver<Maybe<Array<Maybe<ResolversTypes['Proposal']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmergencyContactResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EmergencyContact'] = ResolversParentTypes['EmergencyContact']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EmergencyContactType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FeatureInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FeatureInfo'] = ResolversParentTypes['FeatureInfo']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['Feature'], ParentType, ContextType>;
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

export type GroupedPostResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GroupedPost'] = ResolversParentTypes['GroupedPost']> = ResolversObject<{
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeheResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Hehe'] = ResolversParentTypes['Hehe']> = ResolversObject<{
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  uploader?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HistoryEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['HistoryEntry'] = ResolversParentTypes['HistoryEntry']> = ResolversObject<{
  end?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  holder?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  start?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoginProviderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LoginProvider'] = ResolversParentTypes['LoginProvider']> = ResolversObject<{
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoginResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LoginResponse'] = ResolversParentTypes['LoginResponse']> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MeetingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Meeting'] = ResolversParentTypes['Meeting']> = ResolversObject<{
  appendix?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  documents?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  activatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationActivatePostArgs, 'id'>>;
  addArticle?: Resolver<ResolversTypes['Article'], ParentType, ContextType, RequireFields<MutationAddArticleArgs, 'entry'>>;
  addElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddElectablesArgs, 'electionId'>>;
  addEmergencyContact?: Resolver<ResolversTypes['EmergencyContact'], ParentType, ContextType, RequireFields<MutationAddEmergencyContactArgs, 'name' | 'phone' | 'type'>>;
  addFileToMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddFileToMeetingArgs, 'fileId' | 'fileType' | 'meetingId'>>;
  addHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddHeheArgs, 'fileId' | 'number' | 'year'>>;
  addMeeting?: Resolver<ResolversTypes['Meeting'], ParentType, ContextType, RequireFields<MutationAddMeetingArgs, 'type'>>;
  addPost?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'id' | 'usernames'>>;
  casCreateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCasCreateUserArgs, 'hash' | 'input'>>;
  casLogin?: Resolver<ResolversTypes['CasLoginResponse'], ParentType, ContextType, RequireFields<MutationCasLoginArgs, 'token'>>;
  closeElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createApiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'description'>>;
  createElection?: Resolver<ResolversTypes['Election'], ParentType, ContextType, RequireFields<MutationCreateElectionArgs, 'electables' | 'nominationsHidden'>>;
  createFolder?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<MutationCreateFolderArgs, 'name' | 'path'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deactivatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeactivatePostArgs, 'id'>>;
  deleteApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteApiKeyArgs, 'key'>>;
  deleteFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  issueTokens?: Resolver<ResolversTypes['TokenResponse'], ParentType, ContextType, RequireFields<MutationIssueTokensArgs, 'username'>>;
  linkLoginProvider?: Resolver<ResolversTypes['LoginProvider'], ParentType, ContextType, RequireFields<MutationLinkLoginProviderArgs, 'input'>>;
  login?: Resolver<ResolversTypes['LoginResponse'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'password' | 'username'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  modifyArticle?: Resolver<ResolversTypes['Article'], ParentType, ContextType, RequireFields<MutationModifyArticleArgs, 'articleId' | 'entry'>>;
  modifyPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyPostArgs, 'info'>>;
  nominate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationNominateArgs, 'postIds' | 'username'>>;
  openElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationOpenElectionArgs, 'electionId'>>;
  propose?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationProposeArgs, 'electionId' | 'postId' | 'username'>>;
  providerLogin?: Resolver<ResolversTypes['LoginResponse'], ParentType, ContextType, RequireFields<MutationProviderLoginArgs, 'input'>>;
  refresh?: Resolver<ResolversTypes['TokenResponse'], ParentType, ContextType, RequireFields<MutationRefreshArgs, 'refreshToken'>>;
  removeArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveArticleArgs, 'articleId'>>;
  removeElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveElectablesArgs, 'electionId'>>;
  removeEmergencyContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveEmergencyContactArgs, 'id'>>;
  removeFileFromMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveFileFromMeetingArgs, 'fileType' | 'meetingId'>>;
  removeHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHeheArgs, 'number' | 'year'>>;
  removeHistoryEntry?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHistoryEntryArgs, 'id'>>;
  removeMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMeetingArgs, 'id'>>;
  removeProposal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveProposalArgs, 'electionId' | 'postId' | 'username'>>;
  requestPasswordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'username'>>;
  resetPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'password' | 'token' | 'username'>>;
  respondToNomination?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRespondToNominationArgs, 'accepts' | 'postId'>>;
  sendEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendEmailArgs, 'options'>>;
  setApiKeyAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetApiKeyAccessArgs, 'access' | 'key'>>;
  setElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetElectablesArgs, 'electionId' | 'postIds'>>;
  setHiddenNominations?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetHiddenNominationsArgs, 'electionId' | 'hidden'>>;
  setIndividualAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetIndividualAccessArgs, 'access' | 'username'>>;
  setPostAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetPostAccessArgs, 'access' | 'postId'>>;
  setUserPostEnd?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetUserPostEndArgs, 'end' | 'id'>>;
  unlinkLoginProvider?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUnlinkLoginProviderArgs, 'id'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'input'>>;
  validatePasswordResetToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationValidatePasswordResetTokenArgs, 'token' | 'username'>>;
  validateToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationValidateTokenArgs, 'token'>>;
}>;

export type NominationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Nomination'] = ResolversParentTypes['Nomination']> = ResolversObject<{
  answer?: Resolver<ResolversTypes['NominationAnswer'], ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Object'], any> {
  name: 'Object';
}

export type PostResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  history?: Resolver<Array<ResolversTypes['HistoryEntry']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  interviewRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  postType?: Resolver<ResolversTypes['PostType'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  spots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PostHolderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PostHolder'] = ResolversParentTypes['PostHolder']> = ResolversObject<{
  holder?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProposalResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Proposal'] = ResolversParentTypes['Proposal']> = ResolversObject<{
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  apiKey?: Resolver<ResolversTypes['ApiKey'], ParentType, ContextType, RequireFields<QueryApiKeyArgs, 'key'>>;
  apiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType>;
  article?: Resolver<ResolversTypes['Article'], ParentType, ContextType, RequireFields<QueryArticleArgs, never>>;
  articles?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryArticlesArgs, never>>;
  currentPostHolders?: Resolver<Array<ResolversTypes['PostHolder']>, ParentType, ContextType, RequireFields<QueryCurrentPostHoldersArgs, 'includeInactive'>>;
  doors?: Resolver<Array<ResolversTypes['DoorInfo']>, ParentType, ContextType>;
  election?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType, RequireFields<QueryElectionArgs, 'electionId'>>;
  elections?: Resolver<Array<Maybe<ResolversTypes['Election']>>, ParentType, ContextType, RequireFields<QueryElectionsArgs, 'electionIds'>>;
  features?: Resolver<Array<ResolversTypes['FeatureInfo']>, ParentType, ContextType>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileSystem?: Resolver<ResolversTypes['FileSystemResponse'], ParentType, ContextType, RequireFields<QueryFileSystemArgs, 'folder'>>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFilesArgs, never>>;
  groupedPosts?: Resolver<Array<Maybe<ResolversTypes['GroupedPost']>>, ParentType, ContextType, RequireFields<QueryGroupedPostsArgs, 'includeInactive'>>;
  hehe?: Resolver<Maybe<ResolversTypes['Hehe']>, ParentType, ContextType, RequireFields<QueryHeheArgs, 'number' | 'year'>>;
  hehes?: Resolver<Array<Maybe<ResolversTypes['Hehe']>>, ParentType, ContextType, RequireFields<QueryHehesArgs, 'year'>>;
  hiddenNominations?: Resolver<Array<Maybe<ResolversTypes['Nomination']>>, ParentType, ContextType, RequireFields<QueryHiddenNominationsArgs, 'electionId'>>;
  individualAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  latestBoardMeetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryLatestBoardMeetingsArgs, never>>;
  latestElections?: Resolver<Array<Maybe<ResolversTypes['Election']>>, ParentType, ContextType, RequireFields<QueryLatestElectionsArgs, never>>;
  latestHehe?: Resolver<Array<Maybe<ResolversTypes['Hehe']>>, ParentType, ContextType, RequireFields<QueryLatestHeheArgs, never>>;
  latestnews?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryLatestnewsArgs, never>>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  meeting?: Resolver<Maybe<ResolversTypes['Meeting']>, ParentType, ContextType, RequireFields<QueryMeetingArgs, 'id'>>;
  meetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryMeetingsArgs, never>>;
  myNominations?: Resolver<Array<Maybe<ResolversTypes['Nomination']>>, ParentType, ContextType, RequireFields<QueryMyNominationsArgs, 'electionId'>>;
  newsentries?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryNewsentriesArgs, never>>;
  numberOfMembers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numberOfNominations?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfNominationsArgs, 'electionId'>>;
  numberOfProposals?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfProposalsArgs, 'electionId'>>;
  numberOfVolunteers?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfVolunteersArgs, never>>;
  openElection?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'id'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postId'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, 'includeInactive'>>;
  searchFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QuerySearchFilesArgs, 'search'>>;
  searchUser?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QuerySearchUserArgs, 'search'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  utskott?: Resolver<Maybe<ResolversTypes['Utskott']>, ParentType, ContextType, RequireFields<QueryUtskottArgs, never>>;
}>;

export type TokenResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TokenResponse'] = ResolversParentTypes['TokenResponse']> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  access?: Resolver<ResolversTypes['Access'], ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  class?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emergencyContacts?: Resolver<Array<ResolversTypes['EmergencyContact']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loginProviders?: Resolver<Array<Maybe<ResolversTypes['LoginProvider']>>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  photoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  userPostHistory?: Resolver<Array<Maybe<ResolversTypes['UserPostHistoryEntry']>>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  wikiEdits?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  ApiKey?: ApiKeyResolvers<ContextType>;
  Article?: ArticleResolvers<ContextType>;
  CasLoginResponse?: CasLoginResponseResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DoorInfo?: DoorInfoResolvers<ContextType>;
  Election?: ElectionResolvers<ContextType>;
  EmergencyContact?: EmergencyContactResolvers<ContextType>;
  FeatureInfo?: FeatureInfoResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FileSystemResponse?: FileSystemResponseResolvers<ContextType>;
  FileSystemResponsePath?: FileSystemResponsePathResolvers<ContextType>;
  GroupedPost?: GroupedPostResolvers<ContextType>;
  Hehe?: HeheResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
  LoginProvider?: LoginProviderResolvers<ContextType>;
  LoginResponse?: LoginResponseResolvers<ContextType>;
  Meeting?: MeetingResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Nomination?: NominationResolvers<ContextType>;
  Object?: GraphQLScalarType;
  Post?: PostResolvers<ContextType>;
  PostHolder?: PostHolderResolvers<ContextType>;
  Proposal?: ProposalResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  TokenResponse?: TokenResponseResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPostHistoryEntry?: UserPostHistoryEntryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
