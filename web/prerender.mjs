// Writes one static HTML file per route into dist/site, ready to copy over the legacy site.
// Every page is complete HTML (readable without JavaScript); the bundle then makes it interactive.
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(root, 'dist/site');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/client/.vite/manifest.json'), 'utf8'));
const entry = manifest['src/entry-client.jsx'];
const { pages, MODE } = await import(path.join(root, 'dist/server/entry-server.js'));
const { themeBootScript } = await import(path.join(root, 'src/themes.js'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON inside <script> must not be able to close the tag.
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'dist/client/assets'), path.join(out, 'assets'), { recursive: true });

const list = pages();
for (const p of list) {
  const css = (entry.css || []).map((f) => `<link rel="stylesheet" href="${p.rel}${f}">`).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${themeBootScript()}</script>
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${MODE === 'preview' ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<link rel="icon" href="${p.rel}images/brand/ken-logo-pixel.jpg">
${css}
</head>
<body>
<div id="root">${p.html}</div>
<script id="page-data" type="application/json">${safeJson(p.data)}</script>
<script type="module" src="${p.rel}${entry.file}"></script>
</body>
</html>
`;
  const file = path.join(out, p.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
console.log(`prerendered ${list.length} pages (${MODE}) into ${path.relative(process.cwd(), out)}`);
