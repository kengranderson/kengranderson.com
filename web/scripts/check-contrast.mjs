// Checks every theme in src/site.css for readable colour pairs (WCAG 2.1 contrast ratios)
// and that src/themes.js and site.css list the same themes. Runs before every build.
//
// Usage: npm run check:contrast
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const css = fs.readFileSync(path.join(here, '../src/site.css'), 'utf8');
const { THEMES, DEFAULT_THEME } = await import(path.join(here, '../src/themes.js'));

// [foreground, background, minimum ratio, where it shows up]
const PAIRS = [
  ['--ink', '--paper', 7, 'body text'],
  ['--ink', '--surface', 4.5, 'text on tinted panels'],
  ['--muted', '--paper', 4.5, 'secondary text'],
  ['--muted', '--surface', 4.5, 'secondary text on panels'],
  ['--accent', '--paper', 4.5, 'links, labels, years'],
  ['--accent', '--surface', 4.5, 'links on panels'],
  ['--accent-deep', '--paper', 4.5, 'link hover'],
  ['--on-accent', '--accent', 4.5, 'text on accent bands, chips, buttons'],
  ['--on-accent', '--accent-deep', 4.5, 'text on hovered accent buttons'],
  ['--on-dark', '--dark', 7, 'footer, dark bands, buttons'],
  ['--on-dark', '--dark-hover', 4.5, 'hovered dark cards'],
  ['--on-dark-muted', '--dark', 4.5, 'secondary text on dark'],
  ['--accent-on-dark', '--dark', 3, 'accent display words on dark (large text only)'],
  ['--flag-ink', '--flag', 7, 'VERIFY flags and preview notes']
];

const blocks = {};
for (const m of css.matchAll(/^:root(?:\[data-theme="([\w-]+)"\])?\s*\{([^}]*)\}/gm)) {
  const vars = {};
  for (const v of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
  blocks[m[1] || DEFAULT_THEME] = { ...(blocks[m[1] || DEFAULT_THEME] || {}), ...vars };
}

const hex = (v) => {
  const h = v.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

let fail = 0;
const ids = THEMES.map((t) => t.id);
for (const id of ids) if (!blocks[id]) { console.log(`FAIL theme "${id}" is in themes.js but has no block in site.css`); fail++; }
for (const id of Object.keys(blocks)) if (!ids.includes(id)) { console.log(`FAIL site.css has a block for "${id}" that themes.js does not list`); fail++; }

for (const id of ids) {
  const vars = { ...blocks[DEFAULT_THEME], ...blocks[id] };
  for (const [fg, bg, min, use] of PAIRS) {
    const a = vars[fg], b = vars[bg];
    if (!/^#[0-9a-f]{3,6}$/i.test(a || '') || !/^#[0-9a-f]{3,6}$/i.test(b || '')) { console.log(`FAIL ${id}: ${fg} / ${bg} must be plain hex colours`); fail++; continue; }
    const r = ratio(a, b);
    if (r < min) { console.log(`FAIL ${id}: ${fg} ${a} on ${bg} ${b} is ${r.toFixed(2)}:1, needs ${min}:1 (${use})`); fail++; }
  }
}
if (fail) process.exit(1);
console.log(`OK  ${ids.length} themes, ${PAIRS.length} colour pairs each, all readable`);
