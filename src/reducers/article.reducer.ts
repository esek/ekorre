import { showdown } from 'showdown';
import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

/**
 * Converts MarkDown to HTML
 * @param md String formatted as Markdown
 */
export function convertMarkdownToHtml(md: String): String {
  const html: String = converter.makeHtml(md);
  return html;
}

/**
 * Converts HTML to Markdown
 * @param html String formatted as HTML
 */
export function convertHtmlToMarkdown(html: String): String {
  const md: String = converter.makeHtml(html);
  return md;
}