import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataPath = join(root, 'data', 'overall_colors_upstash.json');

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[åäö]/g, (match) => ({ å: 'a', ä: 'a', ö: 'o' }[match] || match))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const raw = readFileSync(dataPath, 'utf8');
const rows = JSON.parse(raw);

const sorted = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
const used = new Set();

for (const row of sorted) {
  if (!row.content) row.content = {};
  const c = row.content;
  if ('ainejärjestö' in c) {
    c.ainejarjesto = c['ainejärjestö'];
    delete c['ainejärjestö'];
  }
  const org = String(c.ainejarjesto ?? '').trim();
  const variLabel = String(c.vari?.label ?? '').trim();
  const opp = String(c.oppilaitos ?? '').trim();

  let base = org ? generateSlug(org) : generateSlug(`${opp}-${variLabel}`);
  if (!base) base = `haalari-${row.id}`;

  let slug = base;
  const variSlug = variLabel ? generateSlug(variLabel) : '';
  if (used.has(slug)) {
    slug = variSlug ? `${base}-${variSlug}` : `${base}-${row.id}`;
  }
  if (used.has(slug)) {
    slug = `${base}-${row.id}`;
  }
  used.add(slug);
  c.ainejarjestoSlug = slug;
}

const slugs = sorted.map((r) => r.content.ainejarjestoSlug);
const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dup.length) {
  console.error('Duplicate slugs:', [...new Set(dup)]);
  process.exit(1);
}

writeFileSync(dataPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
console.log('Migrated', rows.length, 'rows; unique slugs OK');
