import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { build, root } from './build.mjs';

const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
let pending = Promise.resolve();
async function rebuild() {
  const next = pending.catch(() => {}).then(() => build({ base: '' }));
  pending = next;
  return next;
}
await rebuild();
let requests = Promise.resolve();
const server = createServer((request, response) => {
  requests = requests.catch(() => {}).then(async () => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.endsWith('/') || pathname.endsWith('.html')) await rebuild();
    const output = path.join(root, 'dist');
    const target = path.resolve(output, '.' + pathname);
    if (target !== output && !target.startsWith(output + path.sep)) {
      response.writeHead(403); response.end('Forbidden'); return;
    }
    const info = await stat(target).catch(() => null);
    const file = info?.isDirectory() ? path.join(target, 'index.html') : target;
    const data = await readFile(file).catch(() => null);
    response.writeHead(data ? 200 : 404, { 'Content-Type': types[path.extname(file)] ?? 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(data ?? await readFile(path.join(output, '404.html')));
  } catch (error) {
    process.stderr.write('Preview: ' + error.message + '\n');
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('미리보기를 만들지 못했습니다. 터미널의 오류를 확인하세요.');
  }
  });
});
server.on('error', (error) => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => process.stdout.write('Daily Lab → http://localhost:' + port + '\nMarkdown 수정 후 브라우저를 새로고침하세요.\n'));
