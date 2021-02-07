import { showdown } from 'showdown';
import { sanitize } from 'dompurify';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';
import { ArticleAPI, ArticleModel } from '../api/article.api';
import type { Article } from '../graphql.generated';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

export function articleReducer(promise: Promise<ArticleModel[]> | null, returnAsMarkdown: boolean): Article[] {
  //TODO: This shit
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
