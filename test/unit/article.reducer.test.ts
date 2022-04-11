/* eslint-disable no-multi-str */
import { ArticleResponse } from '@/models/mappers';
import { ArticleType } from '@generated/graphql';
import { PrismaArticle } from '@prisma/client';
import { articleReducer } from '@reducer/article';

const USERNAME = 'aa0000bb-s';
const BODY = 'This is a test body';
const CREATE_DATE = new Date('1999-03-03');
const UPDATE_DATE = new Date('2001-9-11');
const TITLE = 'Sju sjösjuka tester testade slugs';

const expected: ArticleResponse = {
  id: 1337,
  title: TITLE,
  createdAt: CREATE_DATE,
  lastUpdatedAt: UPDATE_DATE,
  signature: 'George Bush',
  articleType: ArticleType.News,
  lastUpdatedBy: {
    username: USERNAME,
  },
  author: {
    username: USERNAME,
  },
  body: BODY,
  slug: 'sju-sjosjuka-tester-testade-slugs-1337',
};

const dummy: PrismaArticle = {
  body: BODY,
  signature: 'George Bush',
  articleType: ArticleType.News,
  title: TITLE,
  refAuthor: USERNAME,
  refLastUpdateBy: USERNAME,
  id: 1337,
  createdAt: CREATE_DATE,
  updatedAt: UPDATE_DATE,
};

const expectedDaSlug = 'sju-sjosjuka-tester-testade-slugs-1337';

test('slug generation', () => {
  const reduced = articleReducer(dummy);
  expect(reduced.slug).toBe(expectedDaSlug);
});

test('slug generation with crazy title', () => {
  const crazyTitle = 'hejØ€@@¡}{[]±±🍊🍊  -- ££';
  const expectedCrazySlug = 'hej-1337';
  const reduced = articleReducer({ ...dummy, title: crazyTitle });
  expect(reduced.slug).toBe(expectedCrazySlug);
});

test('reducer with mocked DatabaseArticle', () => {
  expect(articleReducer(dummy)).toStrictEqual(expected);
});
