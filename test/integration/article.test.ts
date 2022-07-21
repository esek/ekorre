import tokenProvider from '@/auth';
import { Article, ArticleType, Feature, ModifyArticle, NewArticle } from '@generated/graphql';
import {
  ADD_ARTICLE_MUTATION,
  ARTICLES_QUERY,
  ARTICLE_QUERY,
  MODIFY_ARTICLE_MUTATION,
  REMOVE_ARTICLE_MUTATION,
} from '@test/utils/queries';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';

const [createUser1, deleteUser1] = genRandomUser([Feature.NewsEditor]);
const [createUser2, deleteUser2] = genRandomUser([Feature.NewsEditor, Feature.ArticleEditor]);
const [createUser3, deleteUser3] = genRandomUser();

let TEST_USERNAME_0: string;
let TEST_USERNAME_1: string;
let TEST_USER_WITHOUT_ACCESS: string;

const mockNewArticle: NewArticle = {
  title: 'SUP NOLLAN YOYOYO',
  body: '# Some dank ass article containing cool stuff\nNot at all clickbait yo!',
  signature: 'Ett FUCKING Øverphøs',
  tags: ['some', 'neat', 'tags', 'IMPORTANT'],
  articleType: ArticleType.News,
};

const mockModifyArticle: ModifyArticle = {
  body: 'CENSUR',
  signature: 'En liten Redaktör',
  articleType: ArticleType.Information,
};

beforeAll(async () => {
  // Initialize random usernames
  [TEST_USERNAME_0, TEST_USERNAME_1, TEST_USER_WITHOUT_ACCESS] = (
    await Promise.all([createUser1(), createUser2(), createUser3()])
  ).map((u) => u.username);
});

afterAll(async () => {
  await Promise.all([deleteUser1(), deleteUser2(), deleteUser3()]);
});

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop till jwt.sign() och jwt.verify()
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('access control', async () => {
  const accessToken = tokenProvider.issueToken(TEST_USER_WITHOUT_ACCESS, 'access_token');

  const addArticleRes = await requestWithAuth(
    ADD_ARTICLE_MUTATION,
    { entry: mockNewArticle },
    accessToken,
  );

  const getArticle = await requestWithAuth(ARTICLES_QUERY, {}, accessToken);

  const modifyArticleRes = await requestWithAuth(
    MODIFY_ARTICLE_MUTATION,
    {
      articleId: -1, // Should not matter
      entry: mockModifyArticle,
    },
    accessToken,
  );

  const removeArticleRes = await requestWithAuth(
    REMOVE_ARTICLE_MUTATION,
    { articleId: -1 }, // Should not matter
    accessToken,
  );

  expect(addArticleRes.errors).toBeDefined();
  expect(getArticle.data).toBeDefined();
  expect(modifyArticleRes.errors).toBeDefined();
  expect(removeArticleRes.errors).toBeDefined();
});

test('creating, modyfying and deleting article', async () => {
  const accessToken0 = tokenProvider.issueToken(TEST_USERNAME_0, 'access_token');
  const accessToken1 = tokenProvider.issueToken(TEST_USERNAME_1, 'access_token');

  const addArticleRes = await requestWithAuth(
    ADD_ARTICLE_MUTATION,
    { entry: mockNewArticle },
    accessToken0,
  );

  expect(addArticleRes?.errors).toBeUndefined();

  const addArticleData = addArticleRes?.data?.addArticle as Article;

  expect(addArticleData.slug).not.toBeNull();
  expect(addArticleData.id).not.toBeNull();

  // The body will be turned to HTML and won't match
  // eslint-disable-line @typescript-eslint/no-unused-vars
  const { body, ...reducedNewArticle } = mockNewArticle;

  expect(addArticleData).toMatchObject({
    ...reducedNewArticle,
    author: {
      username: TEST_USERNAME_0,
    },
    lastUpdatedBy: {
      username: TEST_USERNAME_0,
    },
  });

  let modifyArticleRes = await requestWithAuth(
    MODIFY_ARTICLE_MUTATION,
    {
      articleId: addArticleData.id,
      entry: mockModifyArticle, // We change to a different article type but are not allowed
    },
    accessToken0,
  );

  expect(modifyArticleRes?.errors).toBeDefined();

  modifyArticleRes = await requestWithAuth(
    MODIFY_ARTICLE_MUTATION,
    {
      articleId: addArticleData.id,
      entry: mockModifyArticle,
    },
    accessToken1, // This user should be allowed
  );

  expect(modifyArticleRes?.errors).toBeUndefined();

  // Now we check that the Article actually was updated properly
  const updatedArticleRes = await requestWithAuth(
    ARTICLE_QUERY,
    {
      id: addArticleData.id,
    },
    accessToken0,
  );

  expect(updatedArticleRes?.errors).toBeUndefined();

  // lastUpdatedAt could have changed, but we are unable to use
  // fake timers here due to DataLoaders shitting themselves if they are
  // are used in the same Node process
  // eslint-disable-line @typescript-eslint/no-unused-vars
  const { lastUpdatedAt, tags, ...noLastUpdatedAtOriginalArticle } = addArticleData;

  expect(updatedArticleRes?.data?.article).toMatchObject({
    ...noLastUpdatedAtOriginalArticle,
    body: mockModifyArticle.body,
    signature: mockModifyArticle.signature,
    articleType: mockModifyArticle.articleType,
    tags: [], // Update will remove all tags
    lastUpdatedBy: {
      username: TEST_USERNAME_1, // This should have been updated
    },
  });

  const removeArticleRes = await requestWithAuth(
    REMOVE_ARTICLE_MUTATION,
    { articleId: addArticleData.id },
    accessToken1,
  );

  expect(removeArticleRes?.errors).toBeUndefined();
  expect(removeArticleRes?.data?.removeArticle).toBeTruthy();

  // Now we check that the Article actually was removed
  const nonExistantArticleRes = await requestWithAuth(
    ARTICLE_QUERY,
    {
      id: addArticleData.id,
      markdown: true,
    },
    accessToken0,
  );

  expect(nonExistantArticleRes?.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        errorType: 'NotFoundError',
      }),
    ]),
  );
});
