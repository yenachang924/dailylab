import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecord, published, validateRelations } from '../scripts/content.mjs';
import { markdown, safeUrl } from '../scripts/markdown.mjs';

const entry = (extra = '', date = '2026-10-26') => `---\ntitle: A small output\ndate: ${date}\nsummary: Working code and a log.\ntags: [SQL, AI]\n${extra}---\n## Input\nA question.`;

test('parses metadata, tags and body', () => {
  const record = parseRecord(entry(), 'a-small-output.md', 'daily');
  assert.deepEqual(record.tags, ['SQL', 'AI']);
  assert.equal(record.slug, 'a-small-output');
  assert.match(record.body, /## Input/);
});
test('rejects missing fields, unknown fields and duplicate keys', () => {
  assert.throws(() => parseRecord('---\ntitle: Hi\n---\nText', 'a.md', 'daily'), /date/);
  assert.throws(() => parseRecord(entry('typo: true\n'), 'a.md', 'daily'), /typo/);
  assert.throws(() => parseRecord(entry('title: duplicate\n'), 'a.md', 'daily'), /duplicate/);
});
test('rejects impossible dates and unsafe filenames', () => {
  assert.throws(() => parseRecord(entry('', '2026-02-30'), 'a.md', 'daily'), /date/);
  assert.throws(() => parseRecord(entry(), '../escape.md', 'daily'), /filename/);
});
test('drafts excluded, records sorted, input unchanged', () => {
  const a = parseRecord(entry('draft: true\n'), 'draft.md', 'daily');
  const b = parseRecord(entry(), 'published.md', 'daily');
  assert.deepEqual(published([a, b]), [b]);
  assert.equal(a.draft, true);
  assert.throws(() => parseRecord(entry('draft: yes\n'), 'a.md', 'daily'), /draft/);
});
test('validates tool relations and optional URLs', () => {
  const a = parseRecord(entry('tool: missing\n'), 'a.md', 'daily');
  assert.throws(() => validateRelations([a], []), /missing/);
  assert.throws(() => parseRecord(entry('commit: javascript:alert(1)\n'), 'a.md', 'daily'), /commit/);
});
test('markdown renders headings, lists, quotes, code and links', () => {
  const html = markdown('## Input\n\n- One\n- Two\n\n> A note\n\n```js\nconst x = "<";\n```\n\n**Done** and `code` and [repo](https://github.com).');
  for (const marker of ['<h2>', '<ul>', '<blockquote>', '<pre>', '<strong>', '<code>', 'https://github.com']) assert.ok(html.includes(marker), marker);
});
test('raw HTML and malicious links are escaped', () => {
  const html = markdown('<script>alert(1)</script>\n\n[bad](javascript:alert)');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.equal(safeUrl('data:text/html,hello'), '');
  assert.equal(safeUrl('https://example.com'), 'https://example.com');
});
