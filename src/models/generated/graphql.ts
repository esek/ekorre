import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { ArticleResponse, FileResponse, MeetingResponse, AccessResourceResponse, ElectionResponse, ProposalResponse, NominationResponse, HeheResponse } from '../mappers';
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
  DateTime: any;
  Object: Record<string, string>;
};

/** Access will be treated as a immutable object! */
export type Access = {
  doors: Array<AccessResource>;
  web: Array<AccessResource>;
};

export type AccessMapping = {
  id: Scalars['Int'];
  resolver: AvailableResolver;
  resources?: Maybe<Array<AccessResource>>;
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
  Admin = 'ADMIN',
  Authenticated = 'AUTHENTICATED',
  Public = 'PUBLIC'
}

/** Body is saved as HTML serversInte, but edited in MarkDown */
export type Article = {
  Int?: Maybe<Scalars['Int']>;
  articleType: ArticleType;
  author: User;
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
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
  News = 'NEWS',
  Information = 'INFORMATION'
}

export type AvailableResolver = {
  name: Scalars['String'];
  type: ResolverType;
};

export type CasLoginResponse = {
  exists: Scalars['Boolean'];
  hash?: Maybe<Scalars['String']>;
  username: Scalars['String'];
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
  Dad = 'DAD',
  Mom = 'MOM',
  SignificantOther = 'SIGNIFICANT_OTHER',
  Brother = 'BROTHER',
  Sister = 'SISTER',
  Other = 'OTHER'
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
  number: Scalars['Int'];
  year: Scalars['Int'];
  uploader: User;
  file: File;
};

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
  /** Kallelse */
  Summons = 'summons',
  /** Handlingar */
  Documents = 'documents',
  LateDocuments = 'lateDocuments',
  Protocol = 'protocol',
  /** Bilaga */
  Appendix = 'appendix'
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
  activatePost: Scalars['Boolean'];
  addAccessResource: Scalars['Boolean'];
  addArticle?: Maybe<Article>;
  addElectables: Scalars['Boolean'];
  addEmergencyContact: Scalars['Boolean'];
  addFileToMeeting: Scalars['Boolean'];
  addHehe: Scalars['Boolean'];
  addMeeting: Scalars['Int'];
  addPost: Scalars['Boolean'];
  addUsersToPost: Scalars['Boolean'];
  casCreateUser: Scalars['Boolean'];
  casLogin: CasLoginResponse;
  closeElection: Scalars['Boolean'];
  createElection: Scalars['Int'];
  createFolder: Scalars['Boolean'];
  createUser: Scalars['Boolean'];
  deactivatePost: Scalars['Boolean'];
  deleteFile: Scalars['Boolean'];
  /** Test user credentials and if valid get a jwt token */
  login?: Maybe<User>;
  logout?: Maybe<Scalars['Boolean']>;
  modifyArticle: Scalars['Boolean'];
  modifyPost: Scalars['Boolean'];
  /** Only possible during open election, so electionId is known */
  nominate: Scalars['Boolean'];
  openElection: Scalars['Boolean'];
  propose: Scalars['Boolean'];
  removeAccessResource: Scalars['Boolean'];
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
  setElectables: Scalars['Boolean'];
  setHiddenNominations: Scalars['Boolean'];
  setIndividualAccess: Scalars['Boolean'];
  setPostAccess: Scalars['Boolean'];
  setResolverMappings: Scalars['Boolean'];
  setUserPostEnd: Scalars['Boolean'];
  updateUser: Scalars['Boolean'];
  validatePasswordResetToken: Scalars['Boolean'];
};


export type MutationActivatePostArgs = {
  slug: Scalars['String'];
};


export type MutationAddAccessResourceArgs = {
  name: Scalars['String'];
  description: Scalars['String'];
  resourceType: AccessResourceType;
  slug: Scalars['String'];
};


export type MutationAddArticleArgs = {
  entry: NewArticle;
};


export type MutationAddElectablesArgs = {
  electionId: Scalars['Int'];
  postnames?: Maybe<Array<Scalars['String']>>;
};


export type MutationAddEmergencyContactArgs = {
  name: Scalars['String'];
  phone: Scalars['String'];
  type: EmergencyContactType;
};


export type MutationAddFileToMeetingArgs = {
  fileId: Scalars['Int'];
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
  postname: Scalars['String'];
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


export type MutationCreateElectionArgs = {
  electables: Array<Maybe<Scalars['String']>>;
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
  slug: Scalars['String'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID'];
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationModifyArticleArgs = {
  articleInt: Scalars['Int'];
  entry: ModifyArticle;
};


export type MutationModifyPostArgs = {
  info: ModifyPost;
};


export type MutationNominateArgs = {
  postnames: Array<Scalars['String']>;
  username: Scalars['String'];
};


export type MutationOpenElectionArgs = {
  electionId: Scalars['Int'];
};


export type MutationProposeArgs = {
  electionId: Scalars['Int'];
  postname: Scalars['String'];
  username: Scalars['String'];
};


export type MutationRemoveAccessResourceArgs = {
  slug: Scalars['String'];
};


export type MutationRemoveArticleArgs = {
  articleInt: Scalars['Int'];
};


export type MutationRemoveElectablesArgs = {
  electionId: Scalars['Int'];
  postnames?: Maybe<Array<Scalars['String']>>;
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
  postname: Scalars['String'];
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
  accepts: NominationResponse;
  postname: Scalars['String'];
};


export type MutationSendEmailArgs = {
  options: SendEmailOptions;
};


export type MutationSetElectablesArgs = {
  electionId: Scalars['Int'];
  postnames: Array<Scalars['String']>;
};


export type MutationSetHiddenNominationsArgs = {
  electionId: Scalars['Int'];
  hidden: Scalars['Boolean'];
};


export type MutationSetIndividualAccessArgs = {
  access: Array<Scalars['String']>;
  username: Scalars['String'];
};


export type MutationSetPostAccessArgs = {
  access: Array<Scalars['String']>;
  postname: Scalars['String'];
};


export type MutationSetResolverMappingsArgs = {
  name: Scalars['String'];
  type: ResolverType;
  slugs?: Maybe<Array<Scalars['String']>>;
};


export type MutationSetUserPostEndArgs = {
  end: Scalars['Date'];
  id: Scalars['Int'];
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

export type Nomination = {
  accepted: NominationResponse;
  post: Post;
  user: User;
};

export enum NominationResponse {
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  Pending = 'PENDING'
}


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

/** Valberedningens förslag */
export type Proposal = {
  post: Post;
  user: User;
};

/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type Query = {
  accessMappings: Array<AccessMapping>;
  accessResource: AccessResource;
  accessResources: Array<AccessResource>;
  article?: Maybe<Article>;
  articles: Array<Maybe<Article>>;
  election?: Maybe<Election>;
  elections: Array<Maybe<Election>>;
  emergencyContacts: Array<EmergencyContact>;
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
  latestnews: Array<Maybe<Article>>;
  me?: Maybe<Me>;
  meeting?: Maybe<Meeting>;
  meetings: Array<Maybe<Meeting>>;
  /** A users own nominations should always be available to them */
  myNominations: Array<Maybe<Nomination>>;
  newsentries: Array<Maybe<Article>>;
  numberOfMembers: Scalars['Int'];
  numberOfNominations: Scalars['Int'];
  numberOfProposals: Scalars['Int'];
  numberOfVolunteers: Scalars['Int'];
  openElection?: Maybe<Election>;
  post?: Maybe<Post>;
  postAccess?: Maybe<Access>;
  posts?: Maybe<Array<Maybe<Post>>>;
  resolverExists: Scalars['Boolean'];
  resolvers: Array<AvailableResolver>;
  searchFiles: Array<File>;
  searchUser: Array<User>;
  user?: Maybe<User>;
  utskott?: Maybe<Utskott>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryAccessMappingsArgs = {
  name?: Maybe<Scalars['String']>;
  type?: Maybe<ResolverType>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryAccessResourceArgs = {
  slug: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryAccessResourcesArgs = {
  type?: Maybe<AccessResourceType>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryArticleArgs = {
  Int?: Maybe<Scalars['Int']>;
  markdown?: Maybe<Scalars['Boolean']>;
  slug?: Maybe<Scalars['String']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryArticlesArgs = {
  Int?: Maybe<Scalars['Int']>;
  articleType?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  creator?: Maybe<Scalars['String']>;
  lastUpdateBy?: Maybe<Scalars['String']>;
  lastUpdatedAt?: Maybe<Scalars['DateTime']>;
  markdown?: Maybe<Scalars['Boolean']>;
  signature?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
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
export type QueryEmergencyContactsArgs = {
  username: Scalars['String'];
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
  answer?: Maybe<NominationResponse>;
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
  markdown?: Maybe<Scalars['Boolean']>;
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
  answer?: Maybe<NominationResponse>;
  electionId: Scalars['Int'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNewsentriesArgs = {
  after?: Maybe<Scalars['DateTime']>;
  before?: Maybe<Scalars['DateTime']>;
  creator?: Maybe<Scalars['String']>;
  markdown?: Maybe<Scalars['Boolean']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfNominationsArgs = {
  electionId: Scalars['Int'];
  postname?: Maybe<Scalars['String']>;
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryNumberOfProposalsArgs = {
  electionId: Scalars['Int'];
  postname?: Maybe<Scalars['String']>;
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
  name: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryPostAccessArgs = {
  postname: Scalars['String'];
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
export type QueryResolverExistsArgs = {
  type: ResolverType;
  name: Scalars['String'];
};


/**
 * Queries and mutations that relies on an election being open
 * does not take an `electionId` parameter.
 */
export type QueryResolversArgs = {
  type?: Maybe<ResolverType>;
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

export enum ResolverType {
  Query = 'QUERY',
  Mutation = 'MUTATION'
}

export type SendEmailOptions = {
  to: Array<Scalars['String']>;
  subject: Scalars['String'];
  template?: Maybe<Scalars['String']>;
  overrides?: Maybe<Scalars['Object']>;
  body?: Maybe<Scalars['String']>;
};

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

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
  Access: ResolverTypeWrapper<Omit<Access, 'doors' | 'web'> & { doors: Array<ResolversTypes['AccessResource']>, web: Array<ResolversTypes['AccessResource']> }>;
  AccessMapping: ResolverTypeWrapper<Omit<AccessMapping, 'resources'> & { resources?: Maybe<Array<ResolversTypes['AccessResource']>> }>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  AccessResource: ResolverTypeWrapper<AccessResourceResponse>;
  String: ResolverTypeWrapper<Scalars['String']>;
  AccessResourceType: AccessResourceType;
  AccessType: AccessType;
  Article: ResolverTypeWrapper<ArticleResponse>;
  ArticleType: ArticleType;
  AvailableResolver: ResolverTypeWrapper<AvailableResolver>;
  CasLoginResponse: ResolverTypeWrapper<CasLoginResponse>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Election: ResolverTypeWrapper<ElectionResponse>;
  EmergencyContact: ResolverTypeWrapper<EmergencyContact>;
  EmergencyContactType: EmergencyContactType;
  File: ResolverTypeWrapper<FileResponse>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  FileSystemResponse: ResolverTypeWrapper<Omit<FileSystemResponse, 'files'> & { files: Array<ResolversTypes['File']> }>;
  FileSystemResponsePath: ResolverTypeWrapper<FileSystemResponsePath>;
  FileType: FileType;
  GroupedPost: ResolverTypeWrapper<Omit<GroupedPost, 'posts'> & { posts: Array<ResolversTypes['Post']> }>;
  Hehe: ResolverTypeWrapper<HeheResponse>;
  HistoryEntry: ResolverTypeWrapper<Omit<HistoryEntry, 'holder'> & { holder: ResolversTypes['User'] }>;
  Me: ResolverTypeWrapper<Omit<Me, 'user'> & { user?: Maybe<ResolversTypes['User']> }>;
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
  Nomination: ResolverTypeWrapper<NominationResponse>;
  NominationResponse: NominationResponse;
  Object: ResolverTypeWrapper<Scalars['Object']>;
  Post: ResolverTypeWrapper<Omit<Post, 'access' | 'history'> & { access: ResolversTypes['Access'], history: Array<ResolversTypes['HistoryEntry']> }>;
  PostType: PostType;
  Proposal: ResolverTypeWrapper<ProposalResponse>;
  Query: ResolverTypeWrapper<{}>;
  ResolverType: ResolverType;
  SendEmailOptions: SendEmailOptions;
  SortOrder: SortOrder;
  UpdateUser: UpdateUser;
  User: ResolverTypeWrapper<Omit<User, 'access' | 'posts' | 'userPostHistory'> & { access: ResolversTypes['Access'], posts: Array<ResolversTypes['Post']>, userPostHistory: Array<Maybe<ResolversTypes['UserPostHistoryEntry']>> }>;
  UserPostHistoryEntry: ResolverTypeWrapper<Omit<UserPostHistoryEntry, 'post'> & { post: ResolversTypes['Post'] }>;
  Utskott: Utskott;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Access: Omit<Access, 'doors' | 'web'> & { doors: Array<ResolversParentTypes['AccessResource']>, web: Array<ResolversParentTypes['AccessResource']> };
  AccessMapping: Omit<AccessMapping, 'resources'> & { resources?: Maybe<Array<ResolversParentTypes['AccessResource']>> };
  Int: Scalars['Int'];
  AccessResource: AccessResourceResponse;
  String: Scalars['String'];
  Article: ArticleResponse;
  AvailableResolver: AvailableResolver;
  CasLoginResponse: CasLoginResponse;
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  Election: ElectionResponse;
  EmergencyContact: EmergencyContact;
  File: FileResponse;
  ID: Scalars['ID'];
  FileSystemResponse: Omit<FileSystemResponse, 'files'> & { files: Array<ResolversParentTypes['File']> };
  FileSystemResponsePath: FileSystemResponsePath;
  GroupedPost: Omit<GroupedPost, 'posts'> & { posts: Array<ResolversParentTypes['Post']> };
  Hehe: HeheResponse;
  HistoryEntry: Omit<HistoryEntry, 'holder'> & { holder: ResolversParentTypes['User'] };
  Me: Omit<Me, 'user'> & { user?: Maybe<ResolversParentTypes['User']> };
  Float: Scalars['Float'];
  Meeting: MeetingResponse;
  ModifyArticle: ModifyArticle;
  ModifyPost: ModifyPost;
  Mutation: {};
  NewArticle: NewArticle;
  NewPost: NewPost;
  NewUser: NewUser;
  Nomination: NominationResponse;
  Object: Scalars['Object'];
  Post: Omit<Post, 'access' | 'history'> & { access: ResolversParentTypes['Access'], history: Array<ResolversParentTypes['HistoryEntry']> };
  Proposal: ProposalResponse;
  Query: {};
  SendEmailOptions: SendEmailOptions;
  UpdateUser: UpdateUser;
  User: Omit<User, 'access' | 'posts' | 'userPostHistory'> & { access: ResolversParentTypes['Access'], posts: Array<ResolversParentTypes['Post']>, userPostHistory: Array<Maybe<ResolversParentTypes['UserPostHistoryEntry']>> };
  UserPostHistoryEntry: Omit<UserPostHistoryEntry, 'post'> & { post: ResolversParentTypes['Post'] };
}>;

export type AccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Access'] = ResolversParentTypes['Access']> = ResolversObject<{
  doors?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  web?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AccessMappingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AccessMapping'] = ResolversParentTypes['AccessMapping']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resolver?: Resolver<ResolversTypes['AvailableResolver'], ParentType, ContextType>;
  resources?: Resolver<Maybe<Array<ResolversTypes['AccessResource']>>, ParentType, ContextType>;
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
  Int?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  articleType?: Resolver<ResolversTypes['ArticleType'], ParentType, ContextType>;
  author?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastUpdatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lastUpdatedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  signature?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AvailableResolverResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AvailableResolver'] = ResolversParentTypes['AvailableResolver']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ResolverType'], ParentType, ContextType>;
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
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  uploader?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
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
  activatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationActivatePostArgs, 'slug'>>;
  addAccessResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddAccessResourceArgs, 'name' | 'description' | 'resourceType' | 'slug'>>;
  addArticle?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<MutationAddArticleArgs, 'entry'>>;
  addElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddElectablesArgs, 'electionId'>>;
  addEmergencyContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddEmergencyContactArgs, 'name' | 'phone' | 'type'>>;
  addFileToMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddFileToMeetingArgs, 'fileId' | 'fileType' | 'meetingId'>>;
  addHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddHeheArgs, 'fileId' | 'number' | 'year'>>;
  addMeeting?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationAddMeetingArgs, 'type'>>;
  addPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddPostArgs, 'info'>>;
  addUsersToPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAddUsersToPostArgs, 'postname' | 'usernames'>>;
  casCreateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCasCreateUserArgs, 'hash' | 'input'>>;
  casLogin?: Resolver<ResolversTypes['CasLoginResponse'], ParentType, ContextType, RequireFields<MutationCasLoginArgs, 'token'>>;
  closeElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createElection?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationCreateElectionArgs, 'electables' | 'nominationsHidden'>>;
  createFolder?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateFolderArgs, 'name' | 'path'>>;
  createUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deactivatePost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeactivatePostArgs, 'slug'>>;
  deleteFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'password' | 'username'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  modifyArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyArticleArgs, 'articleInt' | 'entry'>>;
  modifyPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationModifyPostArgs, 'info'>>;
  nominate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationNominateArgs, 'postnames' | 'username'>>;
  openElection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationOpenElectionArgs, 'electionId'>>;
  propose?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationProposeArgs, 'electionId' | 'postname' | 'username'>>;
  removeAccessResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveAccessResourceArgs, 'slug'>>;
  removeArticle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveArticleArgs, 'articleInt'>>;
  removeElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveElectablesArgs, 'electionId'>>;
  removeEmergencyContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveEmergencyContactArgs, 'id'>>;
  removeFileFromMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveFileFromMeetingArgs, 'fileType' | 'meetingId'>>;
  removeHehe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHeheArgs, 'number' | 'year'>>;
  removeHistoryEntry?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveHistoryEntryArgs, 'id'>>;
  removeMeeting?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveMeetingArgs, 'id'>>;
  removeProposal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveProposalArgs, 'electionId' | 'postname' | 'username'>>;
  requestPasswordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'username'>>;
  resetPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'password' | 'token' | 'username'>>;
  respondToNomination?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRespondToNominationArgs, 'accepts' | 'postname'>>;
  sendEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSendEmailArgs, 'options'>>;
  setElectables?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetElectablesArgs, 'electionId' | 'postnames'>>;
  setHiddenNominations?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetHiddenNominationsArgs, 'electionId' | 'hidden'>>;
  setIndividualAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetIndividualAccessArgs, 'access' | 'username'>>;
  setPostAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetPostAccessArgs, 'access' | 'postname'>>;
  setResolverMappings?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetResolverMappingsArgs, 'name' | 'type'>>;
  setUserPostEnd?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetUserPostEndArgs, 'end' | 'id'>>;
  updateUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'input'>>;
  validatePasswordResetToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationValidatePasswordResetTokenArgs, 'token' | 'username'>>;
}>;

export type NominationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Nomination'] = ResolversParentTypes['Nomination']> = ResolversObject<{
  accepted?: Resolver<ResolversTypes['NominationResponse'], ParentType, ContextType>;
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
  interviewRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  postType?: Resolver<ResolversTypes['PostType'], ParentType, ContextType>;
  postname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  accessMappings?: Resolver<Array<ResolversTypes['AccessMapping']>, ParentType, ContextType, RequireFields<QueryAccessMappingsArgs, never>>;
  accessResource?: Resolver<ResolversTypes['AccessResource'], ParentType, ContextType, RequireFields<QueryAccessResourceArgs, 'slug'>>;
  accessResources?: Resolver<Array<ResolversTypes['AccessResource']>, ParentType, ContextType, RequireFields<QueryAccessResourcesArgs, never>>;
  article?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType, RequireFields<QueryArticleArgs, never>>;
  articles?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryArticlesArgs, never>>;
  election?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType, RequireFields<QueryElectionArgs, 'electionId'>>;
  elections?: Resolver<Array<Maybe<ResolversTypes['Election']>>, ParentType, ContextType, RequireFields<QueryElectionsArgs, 'electionIds'>>;
  emergencyContacts?: Resolver<Array<ResolversTypes['EmergencyContact']>, ParentType, ContextType, RequireFields<QueryEmergencyContactsArgs, 'username'>>;
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
  latestnews?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryLatestnewsArgs, never>>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  meeting?: Resolver<Maybe<ResolversTypes['Meeting']>, ParentType, ContextType, RequireFields<QueryMeetingArgs, 'id'>>;
  meetings?: Resolver<Array<Maybe<ResolversTypes['Meeting']>>, ParentType, ContextType, RequireFields<QueryMeetingsArgs, never>>;
  myNominations?: Resolver<Array<Maybe<ResolversTypes['Nomination']>>, ParentType, ContextType, RequireFields<QueryMyNominationsArgs, 'electionId'>>;
  newsentries?: Resolver<Array<Maybe<ResolversTypes['Article']>>, ParentType, ContextType, RequireFields<QueryNewsentriesArgs, never>>;
  numberOfMembers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numberOfNominations?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfNominationsArgs, 'electionId'>>;
  numberOfProposals?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfProposalsArgs, 'electionId'>>;
  numberOfVolunteers?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryNumberOfVolunteersArgs, never>>;
  openElection?: Resolver<Maybe<ResolversTypes['Election']>, ParentType, ContextType>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'name'>>;
  postAccess?: Resolver<Maybe<ResolversTypes['Access']>, ParentType, ContextType, RequireFields<QueryPostAccessArgs, 'postname'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsArgs, 'includeInactive'>>;
  resolverExists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryResolverExistsArgs, 'type' | 'name'>>;
  resolvers?: Resolver<Array<ResolversTypes['AvailableResolver']>, ParentType, ContextType, RequireFields<QueryResolversArgs, never>>;
  searchFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QuerySearchFilesArgs, 'search'>>;
  searchUser?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QuerySearchUserArgs, 'search'>>;
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
  AccessMapping?: AccessMappingResolvers<ContextType>;
  AccessResource?: AccessResourceResolvers<ContextType>;
  Article?: ArticleResolvers<ContextType>;
  AvailableResolver?: AvailableResolverResolvers<ContextType>;
  CasLoginResponse?: CasLoginResponseResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  Election?: ElectionResolvers<ContextType>;
  EmergencyContact?: EmergencyContactResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FileSystemResponse?: FileSystemResponseResolvers<ContextType>;
  FileSystemResponsePath?: FileSystemResponsePathResolvers<ContextType>;
  GroupedPost?: GroupedPostResolvers<ContextType>;
  Hehe?: HeheResolvers<ContextType>;
  HistoryEntry?: HistoryEntryResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
  Meeting?: MeetingResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Nomination?: NominationResolvers<ContextType>;
  Object?: GraphQLScalarType;
  Post?: PostResolvers<ContextType>;
  Proposal?: ProposalResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPostHistoryEntry?: UserPostHistoryEntryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
