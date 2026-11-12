import defaultSchema from 'hast-util-sanitize/lib/github.json';
import sanitize = require('hast-util-sanitize');
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified = require('unified');

const MAX_BYTES = 100_000;
const schema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames.filter((tag) => tag !== 'img'),
} as unknown as Parameters<typeof sanitize>[1];

type MarkdownElement = {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: MarkdownNode[];
};

type MarkdownNode = {
  type: string;
  children?: MarkdownNode[];
} & Partial<MarkdownElement>;

const externalLinks = (): unified.Transformer => (tree) => {
  const visit = (node: MarkdownNode): void => {
    node.children?.forEach((child) => {
      if (child.type !== 'element') return;

      const element = child as MarkdownElement;
      const href = String(element.properties.href ?? '');
      if (/^(https?:)?\/\//i.test(href)) {
        element.properties.target = '_blank';
        element.properties.rel = ['noopener', 'noreferrer', 'external'];
      }
      visit(element);
    });
  };

  visit(tree as MarkdownNode);
};

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(externalLinks)
  .use(rehypeStringify);

const withinLimit = (value: string): string => {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.byteLength <= MAX_BYTES) return value;

  return bytes.subarray(0, MAX_BYTES).toString('utf8').replace(/\uFFFD$/, '');
};

/** Converts Markdown to HTML and sanitizes the generated markup for HTML rendering. */
export const markdownToSafeHtml = (source: string): string =>
  processor.processSync(withinLimit(source)).toString();
