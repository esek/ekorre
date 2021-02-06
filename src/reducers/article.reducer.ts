import { showdown } from 'showdown';
import { sanitize } from 'dompurify';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
export function convertMarkdownToHtml(md: string): string {
  let html: string = converter.makeHtml(md);
  html = sanitize(html);  // Don't want any dirty XSS xD
  return html;
}

/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
export function convertHtmlToMarkdown(html: string): string {
  const md: string = converter.makeMarkdown(html);
  return md;
}
