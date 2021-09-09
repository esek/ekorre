import { convertMarkdownToHtml, articleReducer } from '../../src/reducers/article.reducer';

// eslint-disable-next-line no-multi-str
const okMarkdown = '\
# Test\n\
\n\
Hello guys and welcome to _my_ **testing** tutorial\n\
\n\
## Help me I\'m stuck in a testcase\n\
\n\
jkjk is [cool](http://example.com)\n\
\n\
#### This is cool file yes\n\
\n\
[Yes file](files/somefile.txt)';

// eslint-disable-next-line no-multi-str
const okHtml = '\
<h2>Test</h2>\n\
<p>Hello guys and welcome to <em>my</em> <strong>testing</strong> tutorial</p>\n\
<h3>Help me I\'m stuck in a testcase</h3>\n\
<p>jkjk is <a href="http://example.com">cool</a></p>\n\
<h5>This is cool file yes</h5>\n\
<p><a href="files/somefile.txt">Yes file</a></p>';

// eslint-disable-next-line no-multi-str
const dirtyMarkdown = '\
# Haxx\n\
\n\
nice XSS bro\n\
\n\
<script src="http://example.com/xss"></script>';

// eslint-disable-next-line no-multi-str
const sanitizedDirtyHtml = '\
<h2>Haxx</h2>\n\
<p>nice XSS bro</p>\n'; 

test('Test converting OK MarkDown to HTML', () => {
  expect(convertMarkdownToHtml(okMarkdown)).toBe(okHtml);
});

test('Test sanitation of diry MarkDown to HTML', () => {
  expect(convertMarkdownToHtml(dirtyMarkdown)).toBe(sanitizedDirtyHtml);
});