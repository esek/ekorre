import { sanitize } from 'dompurify';
import { JSDOM } from 'jsdom';
import showdown from 'showdown';

import { ArticleModel } from '../api/article.api';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);
const dom = new JSDOM();

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
export const convertMarkdownToHtml = (md: string): string => {
  let html = converter.makeHtml(md);
  html = sanitize(html); // Don't want any dirty XSS xD
  return html;
};

/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
const convertHtmlToMarkdown = (html: string): string =>
  converter.makeMarkdown(html, dom.window.document);

/**
 * Creates a slug out of a string
 * Converts it to lowercase
 * Converts å/ä to a, and ö to o
 * Strips special characters
 * Replaces spaces with dashes
 * @param str The string to slugify
 * @returns Slug, ex: `this-is-an-article`
 */
const generateSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const articleReduce = (article: ArticleModel, markdown: boolean): ArticleModel => {
  // Vi lagrar alltid HTML i databasen; vi gör om till markdown vid
  // förfrågan
  const sanatizedBody = !markdown ? article.body : convertHtmlToMarkdown(article.body);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...reduced } = article;
  const a: ArticleModel & { slug: string } = {
    ...reduced,
    body: sanatizedBody,
    slug: generateSlug(`${reduced.title}-${reduced.id}`),
    // Exteremely temporary fix for tags, as knex doesn't send them back as an array
    tags: ((reduced.tags as unknown) as string).split(','),
  };

  return a;
};

// Vi definierar Reducers för alla olika typer av ArticleModels
// Vi returnerar ArticleModel; refuser -> User i resolvern
export async function articleReducer(a: ArticleModel, markdown: boolean): Promise<ArticleModel>;
export async function articleReducer(a: ArticleModel[], markdown: boolean): Promise<ArticleModel[]>;
export async function articleReducer(
  a: ArticleModel | ArticleModel[],
  markdown: boolean,
): Promise<ArticleModel | ArticleModel[]> {
  // Är det en array, reducera varje för sig, annars skicka bara tillbaka en reducerad
  if (a instanceof Array) {
    const aa = await Promise.all(a.map((e) => articleReduce(e, markdown)));
    return aa;
  }
  return articleReduce(a, markdown);
}
