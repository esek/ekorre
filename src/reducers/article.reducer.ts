import { showdown } from 'showdown';

import { SHOWDOWN_CONVERTER_OPTIONS } from './constants';

const converter = new showdown.Converter(SHOWDOWN_CONVERTER_OPTIONS);

/**
 * Converts MarkDown to HTML
 * @param md string formatted as Markdown
 */
export function convertMarkdownToHtml(md: string): string {
  let html: string = converter.makeHtml(md);
  html = removeScriptTags(html);
  return html;
}

/**
 * Motverkar XSS, främst för att script-taggar inte borde få vara med.
 * @param html html med okända script-taggar
 */
function removeScriptTags(html : string): string {
  var div = document.createElement('div');
  div.innerHTML = html;
  var scripts = div.getElementsByTagName('script');
  var i = scripts.length;
  while (i--) {
    scripts[i].parentNode?.removeChild(scripts[i]);  // Frågetecknet ser till att vi inte anropar på null
  }
  return div.innerHTML;
}

/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
export function convertHtmlToMarkdown(html: string): string {
  const md: string = converter.makeMarkdown(html);
  return md;
}
