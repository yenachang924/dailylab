import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { safeUrl } from './markdown.mjs';

const allowed = {
  daily: ['title', 'date', 'summary', 'tags', 'tool', 'commit', 'draft'],
  tools: ['title', 'summary', 'tags', 'status', 'repo', 'demo', 'draft', 'sample']
};
const required = { daily: ['title', 'date', 'summary'], tools: ['title', 'summary', 'status'] };
const statuses = ['building', 'active', 'paused', 'archived'];

function scalar(value) {
  const text = value.trim();
  if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text);
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1);
  return text;
}

function parseMeta(lines, kind) {
  return lines.filter((line) => line.trim() && !line.trim().startsWith('#')).reduce((record, line) => {
    const match = line.match(/^([a-z]+):\s*(.*)$/);
    if (!match) throw new Error('Invalid metadata line: ' + line);
    const [, key, raw] = match;
    if (!allowed[kind].includes(key)) throw new Error('Unknown field: ' + key);
    if (Object.hasOwn(record, key)) throw new Error('duplicate field: ' + key);
    if (['draft', 'sample'].includes(key) && !['true', 'false'].includes(raw)) throw new Error(key + ' must be true or false');
    const value = key === 'tags' ? parseTags(raw) : ['draft', 'sample'].includes(key) ? raw === 'true' : scalar(raw);
    return { ...record, [key]: value };
  }, {});
}

function parseTags(raw) {
  if (!raw.startsWith('[') || !raw.endsWith(']')) throw new Error('tags must use [tag, tag]');
  return [...new Set(raw.slice(1, -1).split(',').map(scalar).filter(Boolean))];
}

export function parseRecord(source, filename, kind) {
  if (!/^[a-z0-9][a-z0-9-]*\.md$/.test(filename)) throw new Error('Invalid filename: ' + filename);
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(filename + ': missing frontmatter');
  const meta = parseMeta(match[1].split('\n'), kind);
  for (const key of required[kind]) if (!meta[key]) throw new Error(filename + ': missing ' + key);
  if (kind === 'daily' && (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !Number.isFinite(Date.parse(meta.date)) || new Date(meta.date).toISOString().slice(0, 10) !== meta.date)) throw new Error(filename + ': invalid date');
  if (kind === 'tools' && !statuses.includes(meta.status)) throw new Error(filename + ': invalid status');
  for (const key of ['commit', 'repo', 'demo']) if (meta[key] && !safeUrl(meta[key])) throw new Error(filename + ': invalid ' + key);
  return { ...meta, tags: meta.tags ?? [], draft: meta.draft ?? false, slug: filename.slice(0, -3), body: match[2].trim(), filename };
}

export const published = (records) => records.filter((record) => !record.draft).toSorted((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.slug.localeCompare(b.slug));

export function validateRelations(entries, tools) {
  for (const entry of entries) if (entry.tool && !tools.some((tool) => tool.slug === entry.tool)) throw new Error(entry.filename + ': unknown or unpublished tool ' + entry.tool);
}

export async function readCollection(root, kind) {
  const directory = path.join(root, 'content', kind);
  const names = (await readdir(directory)).filter((name) => name.endsWith('.md'));
  const records = await Promise.all(names.map(async (name) => parseRecord(await readFile(path.join(directory, name), 'utf8'), name, kind)));
  return published(records);
}
