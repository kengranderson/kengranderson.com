/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Deterministic static build: copy the site, generate published content JSON, write a manifest.
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_OUTPUT, MANIFEST_OUTPUT, SITE_DIR, SITE_EXCLUDES } from './config.mjs';
import { existsExactCase, toPublicRecord, validateRepository } from './content.mjs';
import { stableStringify } from './stable-json.mjs';

function listFiles(dir, prefix = '') {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (SITE_EXCLUDES.some((pattern) => pattern.test(relative))) {
      continue;
    }
    if (entry.isDirectory()) {
      result.push(...listFiles(path.join(dir, entry.name), relative));
    } else if (entry.isFile()) {
      result.push(relative);
    }
  }
  return result;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sourceCommit(root) {
  if (process.env.GITHUB_SHA) {
    return { commit: process.env.GITHUB_SHA, uncommittedChanges: false };
  }
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
    return { commit, uncommittedChanges: status.length > 0 };
  } catch {
    return { commit: null, uncommittedChanges: null };
  }
}

/** Local asset references written literally in an HTML page (not ones assembled in script). */
export function localReferences(html) {
  const refs = new Set();
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]*)"/g)) {
    const value = match[1];
    if (!value || value.includes("'") || /^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) {
      continue;
    }
    refs.add(value.replace(/[?#].*$/, '').replace(/^\//, ''));
  }
  for (const match of html.matchAll(/url\(([^)'"]+)\)/g)) {
    if (!/^(data:|[a-z]+:\/\/)/i.test(match[1])) {
      refs.add(match[1].replace(/^\//, ''));
    }
  }
  return [...refs].filter(Boolean).sort();
}

/**
 * Build the site into outDir. Returns { errors, warnings, manifest }.
 * Nothing is written when validation fails.
 */
export function buildSite({ root, outDir, includeDrafts = false }) {
  const { errors, warnings, records } = validateRepository(root);
  if (errors.length) {
    return { errors, warnings, manifest: null };
  }

  const siteRoot = path.join(root, SITE_DIR);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const relative of listFiles(siteRoot)) {
    const target = path.join(outDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(siteRoot, relative), target);
  }

  const collections = {};
  const counts = {};
  for (const [name, items] of Object.entries(records)) {
    const included = items.filter((r) => includeDrafts || r.status === 'published');
    collections[name] = included
      .map(toPublicRecord)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    counts[name] = { total: items.length, included: included.length };
  }
  const contentFile = path.join(outDir, CONTENT_OUTPUT);
  fs.mkdirSync(path.dirname(contentFile), { recursive: true });
  fs.writeFileSync(contentFile, stableStringify({ includesDrafts: includeDrafts, collections }));

  const indexFile = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    errors.push({ file: `${SITE_DIR}/index.html`, message: 'home page missing from build output' });
  } else {
    for (const ref of localReferences(fs.readFileSync(indexFile, 'utf8'))) {
      if (!existsExactCase(outDir, decodeURI(ref))) {
        warnings.push({ file: `${SITE_DIR}/index.html`, message: `references "${ref}", which is not in the build output` });
      }
    }
  }
  if (errors.length) {
    return { errors, warnings, manifest: null };
  }

  const files = {};
  let totalBytes = 0;
  for (const relative of listFiles(outDir)) {
    const absolute = path.join(outDir, relative);
    files[relative] = sha256(absolute);
    totalBytes += fs.statSync(absolute).size;
  }
  const manifest = {
    generator: 'tools/site/build.mjs',
    source: sourceCommit(root),
    includesDrafts: includeDrafts,
    records: counts,
    legacyWarnings: warnings.length,
    fileCount: Object.keys(files).length,
    totalBytes,
    files
  };
  fs.writeFileSync(path.join(outDir, MANIFEST_OUTPUT), stableStringify(manifest));
  return { errors, warnings, manifest };
}
