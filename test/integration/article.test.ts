import { issueToken } from '@/auth';
import { Article, ArticleType, Feature, ModifyArticle, NewArticle } from '@generated/graphql';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';

const ARTICLE_FIELDS = `
{
  id
  slug
  title
  body
  signature
  createdAt
  lastUpdatedAt
  articleType
  tags {
    tag
  }
  author {
    username
  }
  lastUpdatedBy {
    username
  }
}
`;

const ARTICLE_QUERY = `
  query article($id: ID, $markdown: Boolean) {
    article(id: $id, markdown: $markdown) ${ARTICLE_FIELDS}
  }
`;

const ADD_ARTICLE_MUTATION = `
mutation ($entry: NewArticle!) {
  addArticle(entry: $entry) ${ARTICLE_FIELDS}
}
`;

const MODIFY_ARTICLE_MUTATION = `
mutation ($articleId: ID!, $entry: ModifyArticle!) {
  modifyArticle(articleId: $articleId, entry: $entry)
}
`;

const REMOVE_ARTICLE_MUTATION = `
mutation($articleId: ID!) {
  removeArticle(articleId: $articleId)
}
`;

const [createUser1, deleteUser1] = genRandomUser([Feature.NewsEditor]);
const [createUser2, deleteUser2] = genRandomUser([Feature.NewsEditor]);

let TEST_USERNAME_0: string;
let TEST_USERNAME_1: string;

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
  [TEST_USERNAME_0, TEST_USERNAME_1] = (await Promise.all([
    createUser1(),
    createUser2(),
  ])).map(u => u.username);
});

afterAll(async () => {
  await Promise.all([
    deleteUser1(),
    deleteUser2(),
  ]);
});

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop till jwt.sign() och jwt.verify()
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('creating, modyfying and deleting article', async () => {
  const accessToken0 = issueToken({ username: TEST_USERNAME_0 }, 'accessToken');
  const accessToken1 = issueToken({ username: TEST_USERNAME_1 }, 'accessToken');

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
  const { body, ...reducedNewArticle } = mockNewArticle;

  expect(addArticleData).toMatchObject({
    ...reducedNewArticle,
    creator: {
      username: TEST_USERNAME_0,
    },
    lastUpdatedBy: {
      username: TEST_USERNAME_0,
    },
  });

  const modifyArticleRes = await requestWithAuth(
    MODIFY_ARTICLE_MUTATION,
    {
      articleId: addArticleData.id,
      entry: mockModifyArticle,
    },
    accessToken1, // We update with another user
  );

  expect(modifyArticleRes?.errors).toBeUndefined();
  expect(modifyArticleRes?.data?.modifyArticle).toBeTruthy();

  // Now we check that the Article actually was updated properly
  const updatedArticleRes = await requestWithAuth(
    ARTICLE_QUERY,
    {
      id: addArticleData.id,
      markdown: true, // So we can compare with mockUpdateArticle.body
    },
    accessToken0,
  );

  expect(updatedArticleRes?.errors).toBeUndefined();

  // lastUpdatedAt could have changed, but we are unable to use
  // fake timers here due to DataLoaders shitting themselves if they are
  // are used in the same Node process
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { lastUpdatedAt, ...noLastUpdatedAtOriginalArticle } = addArticleData;

  expect(updatedArticleRes?.data?.article).toMatchObject({
    ...noLastUpdatedAtOriginalArticle,
    body: mockModifyArticle.body,
    signature: mockModifyArticle.signature,
    articleType: mockModifyArticle.articleType,
    lastUpdatedBy: {
      username: TEST_USERNAME_1, // This should have been updated
    },
  });

  const removeArticleRes = await requestWithAuth(
    REMOVE_ARTICLE_MUTATION,
    { articleId: addArticleData.id },
    accessToken0,
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
