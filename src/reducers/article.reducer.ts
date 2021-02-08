import { showdown } from 'showdown';
import { sanitize } from 'dompurify';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';
import { ArticleAPI, ArticleModel } from '../api/article.api';
import type { Article, User } from '../graphql.generated';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

function articleReduce(article: ArticleModel, markdown: boolean): Article {
  // Hur ska man hantera detta? Vi vill ju inte skicka med allt iaf....
  const creator: User = {
    // Använder refuser från ArticleModel för att få detta?
  };

  // Vi lagrar alltid HTML i databasen; vi gör om till markdown vid
  // förfrågan
  article.body = markdown ? article.body : convertHtmlToMarkdown(article.body);

  // Strip sensitive data! https://stackoverflow.com/a/50840024
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refuser, ...reduced } = article;
  const a = { creator, ...reduced };
  return a;
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
export async function articleReducer(a: ArticleModel, markdown: boolean): Promise<Article>;
export async function articleReducer(a: ArticleModel[], markdown: boolean): Promise<Article>;
export async function articleReducer(a: ArticleModel | ArticleModel[], markdown: boolean): Promise<Article | Article[]> {
  // Är det en array, reducera varje för sig, annars skicka bara tillbaka en reducerad
  if (a instanceof Array) {
    const aa = await Promise.all(a.map((e) => articleReduce(e, markdown)));
    return aa;
  }
  return articleReduce(a);
}