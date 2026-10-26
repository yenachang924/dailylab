import { mkdir, readFile, writeFile, cp, rm, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readCollection, validateRelations } from './content.mjs';
import { layout, home, archive, detail } from './templates.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function normalizeBase(value = '') {
  if (!value || value === '/') return '';
  if (!/^\/[a-zA-Z0-9/_-]+\/?$/.test(value) || value.includes('..')) throw new Error('Invalid BASE_PATH');
  return value.replace(/\/+$/, '');
}

function fileCommit(rootPath, filename, repository) {
  if (!repository) return '';
  try {
    const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', filename], { cwd: rootPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^[a-f0-9]{40}$/.test(sha) ? repository + '/commit/' + sha : '';
  } catch { return ''; }
}

export async function build({ directory = root, out = path.join(root, 'dist'), base = process.env.BASE_PATH ?? '', repository = process.env.GITHUB_REPOSITORY ?? '' } = {}) {
  const prefix = normalizeBase(base);
  const config = JSON.parse(await readFile(path.join(directory, 'site.config.json'), 'utf8'));
  if (!['title', 'name', 'description', 'intro'].every((key) => typeof config[key] === 'string' && config[key].trim())) throw new Error('site.config.json: required text missing');
  const repo = config.repository || (repository ? 'https://github.com/' + repository : '');
  if (repo && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repo)) throw new Error('Repository must be a GitHub owner/repository URL');
  const settings = { ...config, repository: repo.replace(/\/$/, '') };
  const [entries, tools] = await Promise.all([readCollection(directory, 'daily'), readCollection(directory, 'tools')]);
  validateRelations(entries, tools);
  const expectedOutput = path.resolve(directory, 'dist');
  if (path.resolve(out) !== expectedOutput) throw new Error('Build output must be the project dist directory');
  const outputInfo = await lstat(out).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (outputInfo?.isSymbolicLink()) throw new Error('Build output cannot be a symbolic link');
  await rm(expectedOutput, { recursive: true, force: true });
  const emit = async (route, title, body, active, description) => {
    const folder = path.join(out, route);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, 'index.html'), layout({ config: settings, base: prefix, active, title, description, body }));
  };
  await mkdir(out, { recursive: true });
  await cp(path.join(directory, 'public'), out, { recursive: true });
  await writeFile(path.join(out, '.nojekyll'), '');
  await emit('', '', home(settings, entries, tools, prefix), 'home');
  for (const [kind, records] of [['daily', entries], ['tools', tools]]) {
    await emit(kind, kind === 'daily' ? 'Daily' : 'Tools', archive(kind, records, prefix), kind);
    for (const record of records) {
      const sourcePath = 'content/' + kind + '/' + record.filename;
      const sourceUrl = settings.repository ? settings.repository + '/blob/main/' + sourcePath : '';
      const commitUrl = record.commit || fileCommit(directory, sourcePath, settings.repository);
      await emit(kind + '/' + record.slug, record.title, detail(kind, record, entries, tools, prefix, sourceUrl, commitUrl), kind, record.summary);
    }
  }
  const notFound = layout({ config: settings, base: prefix, title: '찾을 수 없는 페이지', active: '', body: '<div class="page-heading"><span class="eyebrow">404 / LOST IN THE LAB</span><h1>이 페이지는 아직 없어요.</h1><p>다른 기록에서 다시 시작해볼까요?</p><a class="button primary" href="' + prefix + '/">홈으로 돌아가기 ↗</a></div>' });
  await writeFile(path.join(out, '404.html'), notFound);
  return { entries: entries.length, tools: tools.filter((tool) => !tool.sample).length, out };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  build().then((result) => process.stdout.write('Built ' + result.entries + ' entries and ' + result.tools + ' tools → ' + result.out + '\n'))
    .catch((error) => { process.stderr.write('Build failed: ' + error.message + '\n'); process.exitCode = 1; });
}
