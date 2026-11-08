// LumiDex: official public monster Wiki snapshot importer.
// Run: node scripts/sync-monster-stats.mjs --check | --write
// Only reads official public pages; never uses game login or market data.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://www.lumivaraonline.com';
const db = JSON.parse(await readFile(path.join(root, 'data.json'), 'utf8'));
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) throw new Error('Use --check or --write');

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'LumiDex-personal-wiki-reference/0.6' } });
  if (!response.ok) throw new Error('HTTP '+ response.status + ': ' + url);
  return response.text();
}
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
const num = s => {
  const v = strip(s).replaceAll(',', '');
  if (!/^\d+$/.test(v)) throw new Error('Expected nonnegative integer, got '+v);
  return Number(v);
};
const monsterByName = new Map(db.monsters.map(m => [m.name.replace(/\s+/g, ' ').trim().toLowerCase(), m]));
const index = await get(base + '/wiki/monsters/');
const paths = [...new Set([...index.matchAll(/href="(\/wiki\/monsters\/[a-z0-9-]+\/?)"/g)].map(x => x[1]))];
console.log('Official monster pages found:',paths.length,'local catalog:', db.monsters.length);
if (paths.length !== db.monsters.length) throw new Error('Index page count mismatch, refusing incomplete snapshot');
const results = new Map();
for (let i = 0; i < paths.length; i++) {
  const wiki = base + paths[i];
  const html = await get(wiki);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const facts = html.match(/<dl class="facts">([\s\S]*?)<\/dl>/);
  if (!h1 || !facts) throw new Error('Missing monster detail: ' + wiki);
  const name = strip(h1[1]);
  const found = monsterByName.get(name.toLowerCase());
  if (!found) throw new Error('Official monster not in LumiDex: ' + name + ' @ ' + wiki);
  if (results.has(found.id)) throw new Error('Duplicate monster: ' + found.id);
  const fields = Object.fromEntries([...facts[1].matchAll(/<div><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g)].map(m => [strip(m[1]), strip(m[2])]));
  const required = ['เลเวล','ธาตุ','HP','ATK','MATK','DEF / MDEF','FLEE','HIT','EXP'];
  for (const f of required) if (!fields[f]) throw new Error('Missing '+f+' in '+wiki);
  const [def,mdef] = fields['DEF / MDEF'].split('/').map(num);
  const level = num(fields['เลเวล']);
  if (level !== found.level) throw new Error('Level mismatch for '+name+' ('+level+' / '+found.level+')');
  const rawElement = fields['ธาตุ'];
  const elements = {'ดิน':'Earth','น้ำ':'Water','น้ำแข็ง':'Ice','ลม':'Wind','ไฟ':'Fire','แสง':'Light','เงา':'Shadow','กลาง':'Neutral','ไม่มีธาตุ':'Neutral','ศักดิ์สิทธิ์':'Holy','มืด':'Dark','พิษ':'Poison','ผี':'Ghost'};
  const elementThai = rawElement.replace(/[^\p{Script=Thai}\s]/gu,'').trim();
  const element = elements[elementThai] ?? null;
  const respawnRaw = fields['เกิดใหม่'] ?? null;
  const respawnSeconds = respawnRaw && /^(\d+)\s*วินาที$/.test(respawnRaw) ? Number(respawnRaw.match(/\d+/)[0]) : null;
  results.set(found.id, { hp: num(fields.HP), atk: num(fields.ATK), matk: num(fields.MATK), def, mdef, flee: num(fields.FLEE), hit: num(fields.HIT), exp: num(fields.EXP), element, elementThai, respawnSeconds, wiki });
  if ((i+1) % 15 === 0) console.log('Validated',i+1,'/',paths.length);
  await new Promise(resolve => setTimeout(resolve, 80));
}
if (results.size !== db.monsters.length) throw new Error('Missing monsters');
const missingElements = [...results].filter(([,r]) => !r.element);
if (missingElements.length) throw new Error('Unrecognized element(s): '+missingElements.map(([id,r])=>id+': '+r.elementThai).join('; '));
const payload = {meta: {source: base + '/wiki/monsters/', checked: new Date().toISOString().slice(0,10), count: results.size, schema: 1, note:'Official Wiki monster stats; game updates can change values.'}, monsters: Object.fromEntries(db.monsters.map(m => [m.id, results.get(m.id)]))};
if (mode === '--write') {
  await writeFile(path.join(root,'monster-stats.json'), JSON.stringify(payload,null,2)+'\n','utf8');
  console.log('Wrote monster-stats.json for',results.size,'monsters');
} else {
  console.log('Validated all',results.size,'monsters; sample:', JSON.stringify(results.get('monster-amethyst-wyvern')));
}
