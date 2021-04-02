import { sanitize } from 'dompurify';
import { JSDOM } from 'jsdom';
import showdown from 'showdown';

import { ArticleModel } from '../api/article.api';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter({ ...SHOWDOWN_CONVERTER_OPTIONS });
const dom = new JSDOM();

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
export function convertMarkdownToHtml(md: string): string {
  let html = converter.makeHtml(md);
  html = sanitize(html); // Don't want any dirty XSS xD
  return html;
}

/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
function convertHtmlToMarkdown(html: string): string {
  const md = converter.makeMarkdown(html, dom.window.document);
  return md;
}

function articleReduce(article: ArticleModel, markdown: boolean): ArticleModel {
  // Vi lagrar alltid HTML i databasen; vi gör om till markdown vid
  // förfrågan
  const sanatizedBody = !markdown ? article.body : convertHtmlToMarkdown(article.body);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...reduced } = article;
  const a = { ...reduced, body: sanatizedBody };

  return a;
}

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
