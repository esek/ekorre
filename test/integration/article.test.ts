import { ApolloServer } from 'apollo-server-express';

import { issueToken } from '../../src/auth';
import { NewArticle, ModifyArticle, ArticleType, Article, Mutation } from '../../src/graphql.generated';
import apolloServerConfig from '../../src/serverconfig';
import requestWithAuth from '../utils/requestWithAuth';

const apolloServer = new ApolloServer(apolloServerConfig);

const ADD_ARTICLE_MUTATION = `
mutation ($entry: NewArticle!) {
  addArticle(entry: $entry) {
    creator {
      username
    }
    lastUpdatedBy {
      username
    }
    title
    id
    slug
  }
}
`;

const MODIFY_ARTICLE_MUTATION = `
mutation ($articleId: Int!, $input: ModifyArticle!) {
  modifyArticle(articleId: $articleId, entry: $entry)
}
`;

const REMOVE_ARTICLE_MUTATION = `
mutation($articleId: Int!) {
  removeArticle(articleId: $articleId)
}
`;

const TEST_USERNAME = 'aa0000bb-s'; // From dev database

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

test('creating, modyfying and deleting article', async () => {
  const accessToken = issueToken({ username: TEST_USERNAME }, 'accessToken');

  const addArticleRes = await requestWithAuth(
    ADD_ARTICLE_MUTATION,
    { entry: mockNewArticle },
    accessToken,
  );

  const addArticleData = addArticleRes?.data?.addArticle as Article;

  expect(addArticleRes?.errors).toBeUndefined();
  expect(addArticleData.slug).not.toBeNull();
  expect(addArticleData.id).not.toBeNull();
  expect(addArticleRes?.data).toMatchObject({
    addArticle: {
      creator: {
        username: TEST_USERNAME,
      },
      lastUpdatedBy: {
        username: TEST_USERNAME,
      },
      title: mockNewArticle.title,
    }
  });
});
