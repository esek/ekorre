import { showdown } from 'showdown';
import { sanitize } from 'dompurify';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';
import { Resolvers } from '../graphql.generated'
import { ArticleModel } from '../api/article.api';
import type { Article, User } from '../graphql.generated';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

function articleReduce(article: ArticleModel, markdown: boolean): ArticleModel {

  // Vi lagrar alltid HTML i databasen; vi gör om till markdown vid
  // förfrågan
  article.body = markdown ? article.body : convertHtmlToMarkdown(article.body);

  return article;
}

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
function convertMarkdownToHtml(md: string): string {
  let html: string = converter.makeHtml(md);
  html = sanitize(html);  // Don't want any dirty XSS xD
  return html;
}

/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
function convertHtmlToMarkdown(html: string): string {
  const md: string = converter.makeMarkdown(html);
  return md;
}

// Vi definierar Reducers för alla olika typer av ArticleModels
// Vi returnerar ArticleModel; refuser -> User i resolvern
export async function articleReducer(a: ArticleModel, markdown: boolean): Promise<ArticleModel>;
export async function articleReducer(a: ArticleModel[], markdown: boolean): Promise<ArticleModel[]>;
export async function articleReducer(a: ArticleModel | ArticleModel[], markdown: boolean): Promise<ArticleModel | ArticleModel[]> {
  // Är det en array, reducera varje för sig, annars skicka bara tillbaka en reducerad
  if (a instanceof Array) {
    const aa = await Promise.all(a.map((e) => articleReduce(e, markdown)));
    return aa;
  }
  return articleReduce(a, markdown);
}