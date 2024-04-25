import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ArticleResponse, FileResponse, MeetingResponse, ElectionResponse, ProposalResponse, NominationResponse, HeheResponse, ApiKeyResponse } from '../mappers';
import type { Context } from '../context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
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
  createdAt: Scalars['Date'];
  id: Scalars['Int'];
  lastUpdatedAt: Scalars['Date'];
  lastUpdatedBy: User;
  signature: Scalars['String'];
  /** Used in URLs, but Intentification is done using only tail (Int) */
  slug: Scalars['String'];
  /** Limit if special tags should be included. Will default to true */
  tags: Array<Scalars['String']>;
  title: Scalars['String'];
};


/** Body is saved as HTML serversInte, but edited in MarkDown */
export type ArticleTagsArgs = {
  includeSpecial?: InputMaybe<Scalars['Boolean']>;
};

/** News are the ones to be used by a website newsreel */
export enum ArticleType {
  Information = 'INFORMATION',
  News = 'NEWS'
}

export type CasLoginResponse = {
  exists: Scalars['Boolean'];
  hash: Scalars['String'];
  username: Scalars['String'];
};

/** This represets all doors that E-sektionen own */
export enum Door {
  Arkivet = 'arkivet',
  Bd = 'bd',
  Biljard = 'biljard',
  Cm = 'cm',
  Edekvata = 'edekvata',
  Ekea = 'ekea',
  Hk = 'hk',
  Km = 'km',
  Led = 'led',
  Ledtoa = 'ledtoa',
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
  acceptedNominations: Array<Nomination>;
  closedAt?: Maybe<Scalars['Date']>;
  createdAt: Scalars['Date'];
  creator: User;
  /** Which posts can be elected in the election */
  electables: Array<Post>;
  id: Scalars['Int'];
  /** Whether accepted nominations are to be hidden */
  nominationsHidden: Scalars['Boolean'];
  open: Scalars['Boolean'];
  openedAt?: Maybe<Scalars['Date']>;
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
  AhsAdmin = 'ahs_admin',
  ArticleEditor = 'article_editor',
  DecibelAdmin = 'decibel_admin',
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
  createdAt?: Maybe<Scalars['Date']>;
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
  /** Dagordning */
  agenda?: Maybe<File>;
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
  /** Dagordning */
  Agenda = 'agenda',
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
  /** Studierådsmöten avancerad nivå */
  Sra = 'SRA',
  /** Studierådsmöten grundnivå */
  Srg = 'SRG',
  /** Studierådsmöten intern */
  Sri = 'SRI',
  /** Valmöte */
  Vm = 'VM',
  /** Vårterminsmöte */
  Vtm = 'VTM'
}

/** We don't need every part; It should already exist */
export type ModifyArticle = {
  articleType?: InputMaybe<ArticleType>;
  body?: InputMaybe<Scalars['String']>;
  signature?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<Scalars['String']>>;
  title?: InputMaybe<Scalars['String']>;
};

export type ModifyPost = {
  description?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  formLink?: InputMaybe<Scalars['String']>;
  id: Scalars['Int'];
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: InputMaybe<Scalars['Boolean']>;
  postType?: InputMaybe<PostType>;
  postname?: InputMaybe<Scalars['String']>;
  /** Higher means it will be shown first */
  sortPriority?: InputMaybe<Scalars['Int']>;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: InputMaybe<Scalars['Int']>;
  utskott?: InputMaybe<Utskott>;
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
  addUsersToPost: Post;
  casCreateUser: User;
  casLogin: CasLoginResponse;
  changePassword: Scalars['Boolean'];
  closeElection: Scalars['Boolean'];
  createApiKey: Scalars['String'];
  createElection: Election;
  createFolder: File;
  createUser: User;
  deactivatePost: Scalars['Boolean'];
  deleteApiKey: Scalars['Boolean'];
  deleteFile: Scalars['Boolean'];
  forgetUser: User;
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
  postIds: Array<Scalars['Int']>;
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
  number?: InputMaybe<Scalars['Int']>;
  type: MeetingType;
  year?: InputMaybe<Scalars['Int']>;
};


export type MutationAddPostArgs = {
  info: NewPost;
};


export type MutationAddUsersToPostArgs = {
  end?: InputMaybe<Scalars['Date']>;
  id: Scalars['Int'];
  start?: InputMaybe<Scalars['Date']>;
  usernames: Array<Scalars['String']>;
};


export type MutationCasCreateUserArgs = {
  hash: Scalars['String'];
  input: NewUser;
};


export type MutationCasLoginArgs = {
  token: Scalars['String'];
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String'];
  oldPassword: Scalars['String'];
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


export type MutationForgetUserArgs = {
  username: Scalars['String'];
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
  postIds: Array<Scalars['Int']>;
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
  resetLink: Scalars['String'];
  returnTo?: InputMaybe<Scalars['String']>;
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
  active?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
  postType: PostType;
  /** Higher means it will be shown first */
  sortPriority?: InputMaybe<Scalars['Int']>;
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots?: InputMaybe<Scalars['Int']>;
  utskott: Utskott;
};

export type NewUser = {
  class: Scalars['String'];
  email?: InputMaybe<Scalars['String']>;
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
  /** Email till posten, om sådan finns */
  email?: Maybe<Scalars['String']>;
  formLink?: Maybe<Scalars['String']>;
  history: Array<HistoryEntry>;
  id: Scalars['Int'];
  /** Om sökande valbereds och kallas till intervju */
  interviewRequired?: Maybe<Scalars['Boolean']>;
  postType: PostType;
  postname: Scalars['String'];
  /** Higher means it will be shown first */
  sortPriority: Scalars['Int'];
  /**
   * Hur många platser en post har.
   * `-1` symboliserar godtyckligt antal
   */
  spots: Scalars['Int'];
  utskott: Utskott;
};


export type PostHistoryArgs = {
  current?: InputMaybe<Scalars['Boolean']>;
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
  email?: InputMaybe<Scalars['String']>;
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
  doors: Array<DoorInfo>;
  election: Election;
  elections: Array<Election>;
  features: Array<FeatureInfo>;
  file: File;
  fileSystem: FileSystemResponse;
  files: Array<File>;
  groupedPosts: Array<GroupedPost>;
  hehe: Hehe;
  hehes: Array<Hehe>;
  /** Used if nominations are hidden but an election-admin wants too see nominations */
  hiddenNominations: Array<Nomination>;
  individualAccess: Access;
  latestBoardMeetings: Array<Meeting>;
  latestElections: Array<Election>;
  latestHehe: Array<Hehe>;
  latestnews: Array<Article>;
  me: User;
  meeting: Meeting;
  meetings: Array<Meeting>;
  /** A users own nominations should always be available to them */
  myNominations: Array<Nomination>;
  newsentries: Array<Article>;
  numberOfMembers: Scalars['Int'];
  numberOfNominations: Scalars['Int'];
  numberOfProposals: Scalars['Int'];
  numberOfVolunteers: Scalars['Int'];
  openElection: Election;
  post: Post;
  postAccess: Access;
  posts: Array<Post>;
  searchFiles: Array<File>;
  searchUser: Array<User>;
  user: User;
  userByCard: User;
  users: Array<User>;
  usersWithIndividualAccess: Array<User>;
  utskott: Utskott;
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
  id?: InputMaybe<Scalars['Int']>;
  slug?: InputMaybe<Scalars['String']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryArticlesArgs = {
  author?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  tags?: InputMaybe<Array<Scalars['String']>>;
  type?: InputMaybe<ArticleType>;
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
  type?: InputMaybe<FileType>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryGroupedPostsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']>;
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
  answer?: InputMaybe<NominationAnswer>;
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
  limit?: InputMaybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestElectionsArgs = {
  includeHiddenNominations?: InputMaybe<Scalars['Boolean']>;
  includeUnopened?: InputMaybe<Scalars['Boolean']>;
  limit?: InputMaybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestHeheArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  sortOrder?: InputMaybe<SortOrder>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryLatestnewsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
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
  number?: InputMaybe<Scalars['Int']>;
  type?: InputMaybe<MeetingType>;
  year?: InputMaybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryMyNominationsArgs = {
  answer?: InputMaybe<NominationAnswer>;
  electionId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNewsentriesArgs = {
  after?: InputMaybe<Scalars['Date']>;
  author?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['Date']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfMembersArgs = {
  noAlumni?: InputMaybe<Scalars['Boolean']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfNominationsArgs = {
  electionId: Scalars['Int'];
  postId?: InputMaybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfProposalsArgs = {
  electionId: Scalars['Int'];
  postId?: InputMaybe<Scalars['Int']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfVolunteersArgs = {
  date?: InputMaybe<Scalars['Date']>;
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
  includeInactive?: InputMaybe<Scalars['Boolean']>;
  utskott?: InputMaybe<Utskott>;
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
export type QueryUserByCardArgs = {
  luCard: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryUsersArgs = {
  usernames: Array<Scalars['String']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryUtskottArgs = {
  name: Scalars['String'];
};

export type SendEmailOptions = {
  body?: InputMaybe<Scalars['String']>;
  overrides?: InputMaybe<Scalars['Object']>;
  subject: Scalars['String'];
  template?: InputMaybe<Scalars['String']>;
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
  address?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
  luCard?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
  zipCode?: InputMaybe<Scalars['String']>;
};

export type User = {
  /** This will be all the access have concated from Posts and personal */
  access: Access;
  address?: Maybe<Scalars['String']>;
  class: Scalars['String'];
  email: Scalars['String'];
  emergencyContacts: Array<EmergencyContact>;
  firstName: Scalars['String'];
  fullName: Scalars['String'];
  lastName: Scalars['String'];
  loginProviders: Array<Maybe<LoginProvider>>;
  luCard?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  photoUrl?: Maybe<Scalars['String']>;
  /** Past and current posts held by this user */
  postHistory: Array<UserPostHistoryEntry>;
  /** Currents posts held by this user */
  posts: Array<Post>;
  username: Scalars['String'];
  website?: Maybe<Scalars['String']>;
  wikiEdits: Scalars['Int'];
  zipCode?: Maybe<Scalars['String']>;
};


export type UserPostHistoryArgs = {
  current?: InputMaybe<Scalars['Boolean']>;
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
  Pengu = 'PENGU',
  Sre = 'SRE',
  Styrelsen = 'STYRELSEN'
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

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
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

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
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastUpdatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  lastUpdatedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  signature?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, Partial<ArticleTagsArgs>>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CasLoginResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CasLoginResponse'] = ResolversParentTypes['CasLoginResponse']> = ResolversObject<{
  exists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DoorInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DoorInfo'] = ResolversParentTypes['DoorInfo']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['Door'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ElectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Election'] = ResolversParentTypes['Election']> = ResolversObject<{
  acceptedNominations?: Resolver<Array<ResolversTypes['Nomination']>, ParentType, ContextType>;
  closedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  electables?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  nominationsHidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  openedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
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
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
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
  agenda?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
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
  addElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddElectablesArgs, 'electionId' | 'postIds'>>;
  addEmergencyContact?: Resolver<ResolversTypes['EmergencyContact'], ParentType, ContextType, RequireFields<MutationAddEmergencyContactArgs, 'name' | 'phone' | 'type'>>;
  addFileToMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddFileToMeetingArgs, 'fileId' | 'fileType' | 'meetingId'>>;
  addHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddHeheArgs, 'fileId' | 'number' | 'year'>>;
  addMeeting?: Resolver<ResolversTypes['Meeting'], ParentType, ContextType, RequireFields<MutationAddMeetingArgs, 'type'>>;
  addPost?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'id' | 'usernames'>>;
  casCreateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCasCreateUserArgs, 'hash' | 'input'>>;
  casLogin?: Resolver<ResolversTypes['CasLoginResponse'], ParentType, ContextType, RequireFields<MutationCasLoginArgs, 'token'>>;
  changePassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'newPassword' | 'oldPassword'>>;
  closeElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createApiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'description'>>;
  createElection?: Resolver<ResolversTypes['Election'], ParentType, ContextType, RequireFields<MutationCreateElectionArgs, 'electables' | 'nominationsHidden'>>;
  createFolder?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<MutationCreateFolderArgs, 'name' | 'path'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deactivatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeactivatePostArgs, 'id'>>;
  deleteApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteApiKeyArgs, 'key'>>;
  deleteFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  forgetUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationForgetUserArgs, 'username'>>;
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
  removeElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveElectablesArgs, 'electionId' | 'postIds'>>;
  removeEmergencyContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveEmergencyContactArgs, 'id'>>;
  removeFileFromMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveFileFromMeetingArgs, 'fileType' | 'meetingId'>>;
  removeHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHeheArgs, 'number' | 'year'>>;
  removeHistoryEntry?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHistoryEntryArgs, 'id'>>;
  removeMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMeetingArgs, 'id'>>;
  removeProposal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveProposalArgs, 'electionId' | 'postId' | 'username'>>;
  requestPasswordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'resetLink' | 'username'>>;
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
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  formLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  history?: Resolver<Array<ResolversTypes['HistoryEntry']>, ParentType, ContextType, Partial<PostHistoryArgs>>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  interviewRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  postType?: Resolver<ResolversTypes['PostType'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sortPriority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  spots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType>;
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
  article?: Resolver<ResolversTypes['Article'], ParentType, ContextType, Partial<QueryArticleArgs>>;
  articles?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, Partial<QueryArticlesArgs>>;
  doors?: Resolver<Array<ResolversTypes['DoorInfo']>, ParentType, ContextType>;
  election?: Resolver<ResolversTypes['Election'], ParentType, ContextType, RequireFields<QueryElectionArgs, 'electionId'>>;
  elections?: Resolver<Array<ResolversTypes['Election']>, ParentType, ContextType, RequireFields<QueryElectionsArgs, 'electionIds'>>;
  features?: Resolver<Array<ResolversTypes['FeatureInfo']>, ParentType, ContextType>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileSystem?: Resolver<ResolversTypes['FileSystemResponse'], ParentType, ContextType, RequireFields<QueryFileSystemArgs, 'folder'>>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, Partial<QueryFilesArgs>>;
  groupedPosts?: Resolver<Array<ResolversTypes['GroupedPost']>, ParentType, ContextType, Partial<QueryGroupedPostsArgs>>;
  hehe?: Resolver<ResolversTypes['Hehe'], ParentType, ContextType, RequireFields<QueryHeheArgs, 'number' | 'year'>>;
  hehes?: Resolver<Array<ResolversTypes['Hehe']>, ParentType, ContextType, RequireFields<QueryHehesArgs, 'year'>>;
  hiddenNominations?: Resolver<Array<ResolversTypes['Nomination']>, ParentType, ContextType, RequireFields<QueryHiddenNominationsArgs, 'electionId'>>;
  individualAccess?: Resolver<ResolversTypes['Access'], ParentType, ContextType, RequireFields<QueryIndividualAccessArgs, 'username'>>;
  latestBoardMeetings?: Resolver<Array<ResolversTypes['Meeting']>, ParentType, ContextType, Partial<QueryLatestBoardMeetingsArgs>>;
  latestElections?: Resolver<Array<ResolversTypes['Election']>, ParentType, ContextType, Partial<QueryLatestElectionsArgs>>;
  latestHehe?: Resolver<Array<ResolversTypes['Hehe']>, ParentType, ContextType, Partial<QueryLatestHeheArgs>>;
  latestnews?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, Partial<QueryLatestnewsArgs>>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  meeting?: Resolver<ResolversTypes['Meeting'], ParentType, ContextType, RequireFields<QueryMeetingArgs, 'id'>>;
  meetings?: Resolver<Array<ResolversTypes['Meeting']>, ParentType, ContextType, Partial<QueryMeetingsArgs>>;
  myNominations?: Resolver<Array<ResolversTypes['Nomination']>, ParentType, ContextType, RequireFields<QueryMyNominationsArgs, 'electionId'>>;
  newsentries?: Resolver<Array<ResolversTypes['Article']>, ParentType, ContextType, Partial<QueryNewsentriesArgs>>;
  numberOfMembers?: Resolver<ResolversTypes['Int'], ParentType, ContextType, Partial<QueryNumberOfMembersArgs>>;
  numberOfNominations?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfNominationsArgs, 'electionId'>>;
  numberOfProposals?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfProposalsArgs, 'electionId'>>;
  numberOfVolunteers?: Resolver<ResolversTypes['Int'], ParentType, ContextType, Partial<QueryNumberOfVolunteersArgs>>;
  openElection?: Resolver<ResolversTypes['Election'], ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<QueryPostArgs, 'id'>>;
  postAccess?: Resolver<ResolversTypes['Access'], ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postId'>>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType, Partial<QueryPostsArgs>>;
  searchFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QuerySearchFilesArgs, 'search'>>;
  searchUser?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QuerySearchUserArgs, 'search'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'username'>>;
  userByCard?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserByCardArgs, 'luCard'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUsersArgs, 'usernames'>>;
  usersWithIndividualAccess?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  utskott?: Resolver<ResolversTypes['Utskott'], ParentType, ContextType, RequireFields<QueryUtskottArgs, 'name'>>;
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
  fullName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loginProviders?: Resolver<Array<Maybe<ResolversTypes['LoginProvider']>>, ParentType, ContextType>;
  luCard?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  photoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postHistory?: Resolver<Array<ResolversTypes['UserPostHistoryEntry']>, ParentType, ContextType, Partial<UserPostHistoryArgs>>;
  posts?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
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
  Proposal?: ProposalResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  TokenResponse?: TokenResponseResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPostHistoryEntry?: UserPostHistoryEntryResolvers<ContextType>;
}>;

