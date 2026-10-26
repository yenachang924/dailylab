export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? String(value) : '';
  } catch { return ''; }
}

function inline(source) {
  const pattern = /\x60([^\x60]+)\x60|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  const result = [...source.matchAll(pattern)].reduce(({ html, offset }, match) => {
    const [all, code, label, url, bold] = match;
    const replacement = code ? '<code>' + escapeHtml(code) + '</code>'
      : bold ? '<strong>' + escapeHtml(bold) + '</strong>'
      : safeUrl(url) ? '<a href="' + escapeHtml(url) + '" rel="noreferrer">' + escapeHtml(label) + '</a>'
      : escapeHtml(label);
    return { html: html + escapeHtml(source.slice(offset, match.index)) + replacement, offset: match.index + all.length };
  }, { html: '', offset: 0 });
  return result.html + escapeHtml(source.slice(result.offset));
}

export function markdown(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (/^\x60{3}/.test(line)) {
      const code = [];
      while (i + 1 < lines.length && !/^\x60{3}/.test(lines[i + 1])) code.push(lines[++i]);
      if (i + 1 < lines.length) i += 1;
      blocks.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
      continue;
    }
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      blocks.push('<h' + heading[1].length + '>' + inline(heading[2]) + '</h' + heading[1].length + '>');
      continue;
    }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const prefix = ordered ? /^\d+\. / : /^[-*] /;
      const items = [line.replace(prefix, '')];
      while (i + 1 < lines.length && prefix.test(lines[i + 1])) items.push(lines[++i].replace(prefix, ''));
      const tag = ordered ? 'ol' : 'ul';
      blocks.push('<' + tag + '>' + items.map((item) => '<li>' + inline(item) + '</li>').join('') + '</' + tag + '>');
      continue;
    }
    if (/^> ?/.test(line)) {
      blocks.push('<blockquote>' + inline(line.replace(/^> ?/, '')) + '</blockquote>');
      continue;
    }
    if (/^---+$/.test(line.trim())) { blocks.push('<hr>'); continue; }
    const paragraph = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#|\x60{3}|[-*] |>|\d+\. )/.test(lines[i + 1])) paragraph.push(lines[++i]);
    blocks.push('<p>' + inline(paragraph.join('\n')).replace(/\n/g, '<br>') + '</p>');
  }
  return blocks.join('\n');
}
