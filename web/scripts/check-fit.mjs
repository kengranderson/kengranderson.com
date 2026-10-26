// Measures every heading on every built page at several screen widths and fails if
// a heading is wider than its box, a word is split across lines, or the page scrolls sideways.
//
// Usage (after scripts/build-site.sh): npm run check:fit [-- path/to/_site]
// Needs Playwright with Chromium (preinstalled in Claude Code cloud sessions; elsewhere:
// npm i -D playwright && npx playwright install chromium).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '../../_site'));
const WIDTHS = [360, 390, 768, 1024, 1440];
const HEADINGS = 'h1, h2, h3, .display, .door__title, .card__title, .tl-year__label, .pullquote p, .intent__title, .signage__text, .lineage__title, .lineage-card strong, .row__title, .features strong, .plaque__title, .brand__name, .site-footer__motto > span';

// Every page the React build wrote (one index.html per route), plus the home page.
function routes() {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && ['work', 'timeline', 'philosophy', 'connect'].includes(rel.split('/')[0] || e.name)) walk(path.join(dir, e.name), `${rel}${e.name}/`);
      else if (e.name === 'index.html' && rel) out.push(rel);
    }
  };
  walk(root, '');
  return ['', ...out.sort()];
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split(/[?#]/)[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const problems = [];
const pages = routes();
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort()); // YouTube thumbnails etc.
  const page = await ctx.newPage();
  for (const route of pages) {
    await page.goto(base + route, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const found = await page.evaluate((sel) => {
      const issues = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) issues.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
      for (const el of document.querySelectorAll(sel)) {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue; // hidden
        const label = `"${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
        if (el.scrollWidth > el.clientWidth + 1) issues.push(`${label} is ${el.scrollWidth - el.clientWidth}px wider than its box`);
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node; (node = walker.nextNode());) {
          for (const m of node.data.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, m.index);
            range.setEnd(node, m.index + m[0].length);
            const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
            if (lines.size > 1) issues.push(`${label}: the word "${m[0]}" breaks across lines`);
          }
        }
      }
      return issues;
    }, HEADINGS);
    for (const f of found) problems.push(`${String(width).padStart(4)}px  /${route}  ${f}`);
  }
  await ctx.close();
}
await browser.close();
server.close();

if (problems.length) {
  console.log([...new Set(problems)].join('\n'));
  console.log(`FAIL ${problems.length} heading fit problems across ${pages.length} pages × ${WIDTHS.length} widths`);
  process.exit(1);
}
console.log(`OK  every heading fits on ${pages.length} pages at ${WIDTHS.join(', ')}px`);
