#!/usr/bin/env node
/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Serve a built site folder on localhost for review before publishing.
 *          Usage: node tools/site/serve.mjs [--dir dist] [--port 8080]
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { DIST_DIR, REPO_ROOT } from './lib/config.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const root = path.resolve(REPO_ROOT, option('--dir', DIST_DIR));
const port = Number(option('--port', 8080));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No built site in ${root}. Run "npm run build" (or "npm run build:preview" to include drafts) first.`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, '127.0.0.1', () => console.log(`Serving ${path.relative(REPO_ROOT, root) || root} at http://localhost:${port}/`));
