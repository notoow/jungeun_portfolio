import { readFile, stat, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const html = await readFile(join(root, 'index.html'), 'utf8');
assert(html.includes('jungeun park'), 'Missing document title');
const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map((m) => m[1])
  .filter((u) => u.startsWith('/jungeun_portfolio/'));
assert(
  references.some((u) => u.endsWith('.js')),
  'Missing entry script',
);
for (const url of references)
  await access(join(root, url.replace('/jungeun_portfolio/', '')));
const projects = JSON.parse(
  await readFile(join(root, 'data/projects.json'), 'utf8'),
);
assert.equal(projects.length, 61, 'A project was lost during import');
assert.equal(new Set(projects.map((p) => p.id)).size, projects.length);
let images = 0;
for (const p of projects) {
  assert(p.title && p.url.startsWith('https://infj.myportfolio.com/'));
  for (const image of [p.cover, ...p.images]) {
    assert(image.width > 0 && image.height > 0);
    const path = resolve(root, image.src);
    assert(path.startsWith(root));
    assert((await stat(path)).size > 0);
    if (image.mini) await access(join(root, image.mini));
    if (image.poster) await access(join(root, image.poster));
    images++;
  }
}
await access(join(root, 'fonts/PretendardVariable.woff2'));
await access(join(root, 'fonts/OFL.txt'));
for (const composition of ['landscape', 'portrait'])
  assert((await stat(join(root, `meadow/${composition}.webp`))).size > 0);
console.log(
  `Static build verified: ${projects.length} projects, ${images} images, local font and hero assets.`,
);
