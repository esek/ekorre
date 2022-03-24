/* eslint-disable no-multi-str */
import { ArticleResponse } from '@/models/mappers';
import { PrismaArticle } from '@prisma/client';
import { ArticleType } from '@generated/graphql';
import { articleReducer, convertMarkdownToHtml } from '@reducer/article';

const okMarkdown =
  "\
# Test🍍\n\
\n\
Hello guys and welcome to *my* **testing** tutorial\n\
\n\
## Help me I'm stuck in a testcase\n\
\n\
jkjk is [cool](<http://example.com>)\n\
\n\
#### This is cool file yes\n\
\n\
[Yes file](<files/somefile.txt>)";

// eslint-disable-next-line no-multi-str
const okHtml =
  '\
<h1>Test🍍</h1>\n\
<p>Hello guys and welcome to <em>my</em> <strong>testing</strong> tutorial</p>\n\
<h2>Help me I\'m stuck in a testcase</h2>\n\
<p>jkjk is <a href="http://example.com">cool</a></p>\n\
<h4>This is cool file yes</h4>\n\
<p><a href="files/somefile.txt">Yes file</a></p>';

// eslint-disable-next-line no-multi-str
const dirtyMarkdown =
  '\
# Haxx\n\
\n\
nice XSS bro\n\
\n\
<script src="http://example.com/xss"></script>';

// eslint-disable-next-line no-multi-str
const sanitizedDirtyHtml = '\
<h1>Haxx</h1>\n\
<p>nice XSS bro</p>';

const oda: Omit<PrismaArticle, 'refAuthor' | 'refLastUpdateBy'> = {
  id: 1337,
  title: 'Sju sjösjuka tester testade slugs--',
  body: okHtml,
  createdAt: new Date('1969-05-01'),
  lastUpdatedAt: new Date('2001-09-10'),
  signature: 'George Bush',
  tags: ['Nollning', 'Memes', 'Øl'],
  articleType: ArticleType.News,
};

const da: PrismaArticle = {
  ...oda,
  refAuthor: 'aa0000bb-s',
  refLastUpdateBy: 'bb1111cc-s',
};

const expectedDaSlug = 'sju-sjosjuka-tester-testade-slugs-testid1337';

const expectedDaRes: ArticleResponse = {
  ...oda,
  slug: expectedDaSlug,
  author: {
    username: da.refAuthor,
  },
  lastUpdatedBy: {
    username: da.refLastUpdateBy,
  },
};

test('converting OK MarkDown to HTML', () => {
  expect(convertMarkdownToHtml(okMarkdown)).toBe(okHtml);
});

test('sanitation of dirty MarkDown to HTML', () => {
  expect(convertMarkdownToHtml(dirtyMarkdown)).toBe(sanitizedDirtyHtml);
});

test('slug generation', () => {
  return articleReducer(da, false).then((reduced) => {
    expect(reduced.slug).toBe(expectedDaSlug);
  });
});

test('slug generation with no id', () => {
  const id = da.id ?? '';
  const localExpectedDaSlug = expectedDaSlug.substring(0, expectedDaSlug.indexOf(id));
  return articleReducer({ ...da, id: undefined }, false).then((reduced) => {
    expect(reduced.slug).toBe(localExpectedDaSlug);
  });
});

test('slug generation with crazy title', () => {
  const crazyTitle = 'hejØ€@@¡}{[]±±🍊🍊  -- ££';
  const expectedCrazySlug = 'hej-testid1337';
  return articleReducer({ ...da, title: crazyTitle }, false).then((reduced) => {
    expect(reduced.slug).toBe(expectedCrazySlug);
  });
});

test('reducing array of PrismaArticles', () => {
  const father = [da, da];
  return articleReducer(father, false).then((reduced) => {
    expect(reduced.length).toBe(2);
    expect(reduced).toStrictEqual([expectedDaRes, expectedDaRes]);
  });
});

test('full reduction of OK PrismaArticle', () => {
  return articleReducer(da, true).then((reduced) => {
    expect(reduced).toStrictEqual({
      ...expectedDaRes,
      body: okMarkdown,
    });
  });
});

test('full reduction of OK PrismaArticle array', () => {
  const father = [da, da];
  return articleReducer(father, true).then((reduced) => {
    expect(reduced.length).toBe(2);
    expect(reduced).toStrictEqual([
      {
        ...expectedDaRes,
        body: okMarkdown,
      },
      {
        ...expectedDaRes,
        body: okMarkdown,
      },
    ]);
  });
});
