/* eslint-disable no-multi-str */
import { ArticleResponse } from '@/models/mappers';
import { PrismaExtendedArticle } from '@/models/prisma';
import { parseSlug } from '@/util';
import { ArticleType } from '@generated/graphql';
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
  tags: ['tag1'],
};

const dummy: PrismaExtendedArticle = {
  body: BODY,
  signature: 'George Bush',
  articleType: ArticleType.News,
  title: TITLE,
  refAuthor: USERNAME,
  refLastUpdateBy: USERNAME,
  id: 1337,
  createdAt: CREATE_DATE,
  updatedAt: UPDATE_DATE,
  tags: [
    {
      tag: 'tag1',
      id: 0,
      refArticle: 0,
    },
  ],
};

test('slug parsing', () => {
  if (!expected.slug) {
    throw new Error('expected.slug is undefined');
  }

  expect(parseSlug(expected.slug)).toBe(expected.id);
});

test('slug generation', () => {
  const reduced = articleReducer(dummy);
  expect(reduced.slug).toBe(expected.slug);
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
