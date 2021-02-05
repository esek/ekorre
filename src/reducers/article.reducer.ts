import { showdown } from 'showdown';

import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
export function convertMarkdownToHtml(md: string): string {
  const html: string = converter.makeHtml(md);
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
