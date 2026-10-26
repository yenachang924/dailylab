import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export function seoulDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export async function createEntry(slug, { directory = fileURLToPath(new URL('../', import.meta.url)), now = new Date() } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('영문 소문자·숫자·하이픈으로 이름을 입력하세요. 예: npm run new -- file-hash');
  const date = seoulDate(now);
  const template = await readFile(path.join(directory, 'templates', 'daily.md'), 'utf8');
  const filename = path.join(directory, 'content', 'daily', date + '-' + slug + '.md');
  await writeFile(filename, template.replace(/^date: .+$/m, 'date: ' + date), { flag: 'wx' });
  return filename;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  createEntry(process.argv[2]).then((filename) => process.stdout.write('Created draft: ' + filename + '\n'))
    .catch((error) => { process.stderr.write(error.code === 'EEXIST' ? '같은 이름의 기록이 이미 있습니다. 다른 이름을 사용하세요.\n' : error.message + '\n'); process.exitCode = 1; });
}
