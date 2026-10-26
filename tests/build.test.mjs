import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, root, normalizeBase } from '../scripts/build.mjs';
import { createEntry, seoulDate } from '../scripts/new-entry.mjs';

test('normalizes base paths and rejects traversal', () => {
  assert.equal(normalizeBase('/daily-lab/'), '/daily-lab');
  assert.equal(normalizeBase('/'), '');
  assert.throws(() => normalizeBase('/../oops'), /BASE_PATH/);
});
test('Seoul dates handle UTC midnight boundaries', () => {
  assert.equal(seoulDate(new Date('2026-10-25T15:30:00Z')), '2026-10-26');
});
test('builds pages, excludes drafts and resolves all local links at a repository base', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'daily-lab-test-'));
  try {
    for (const name of ['content', 'public', 'templates', 'site.config.json']) await cp(path.join(root, name), path.join(temporary, name), { recursive: true });
    const draft = await createEntry('draft-test', { directory: temporary, now: new Date('2026-10-27T00:00:00Z') });
    await assert.rejects(createEntry('draft-test', { directory: temporary, now: new Date('2026-10-27T00:00:00Z') }), { code: 'EEXIST' });
    await assert.rejects(createEntry('../bad', { directory: temporary }), /하이픈/);
    const output = path.join(temporary, 'dist');
    const result = await build({ directory: temporary, out: output, base: '/daily-lab', repository: 'example/daily-lab' });
    assert.equal(result.entries, 1);
    const visit = async (folder) => {
      for (const item of await readdir(folder, { withFileTypes: true })) {
        const file = path.join(folder, item.name);
        if (item.isDirectory()) { await visit(file); continue; }
        if (!item.name.endsWith('.html')) continue;
        const html = await readFile(file, 'utf8');
        assert.ok(!html.includes('draft-test'));
        for (const match of html.matchAll(/(?:href|src)="(\/daily-lab\/[^"]*)"/g)) {
          const pathname = new URL(match[1], 'https://example.test').pathname;
          const target = path.join(output, pathname.slice('/daily-lab/'.length));
          assert.ok(await stat(target).catch(() => null), 'Broken local link ' + match[1]);
        }
      }
    };
    await visit(output);
    const source = await readFile(draft, 'utf8');
    await writeFile(draft, source.replace('draft: true', 'draft: false'));
    const next = await build({ directory: temporary, out: output, base: '' });
    assert.equal(next.entries, 2);
    assert.match(await readFile(path.join(output, 'daily', '2026-10-27-draft-test', 'index.html'), 'utf8'), /오늘 만든 것/);
    await writeFile(draft, source);
    await build({ directory: temporary, out: output });
    assert.equal(await stat(path.join(output, 'daily', '2026-10-27-draft-test')).catch(() => null), null, 'unpublished content must be removed');
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
