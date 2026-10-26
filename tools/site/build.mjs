#!/usr/bin/env node
/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Validate, then build the static site into dist/.
 *          Usage: node tools/site/build.mjs [--drafts] [--out <dir>]
 *          --drafts includes draft and review records for a local preview; such a build is never deployed.
 */

import path from 'node:path';
import { DIST_DIR, REPO_ROOT } from './lib/config.mjs';
import { buildSite } from './lib/build.mjs';
import { printProblems } from './lib/report.mjs';

const args = process.argv.slice(2);
const includeDrafts = args.includes('--drafts');
const outIndex = args.indexOf('--out');
const outDir = path.resolve(REPO_ROOT, outIndex >= 0 ? args[outIndex + 1] : DIST_DIR);

const result = buildSite({ root: REPO_ROOT, outDir, includeDrafts });
printProblems(result);

if (result.errors.length) {
  console.error(`Build failed with ${result.errors.length} error(s). Nothing was published.`);
  process.exit(1);
}

const m = result.manifest;
const records = Object.entries(m.records)
  .map(([name, c]) => `${name} ${c.included}/${c.total}`)
  .join(', ');
console.log(`Built ${m.fileCount} files (${(m.totalBytes / 1048576).toFixed(1)} MB) into ${path.relative(REPO_ROOT, outDir) || '.'}`);
console.log(`Records included (included/total): ${records}${includeDrafts ? '  [PREVIEW: drafts included]' : ''}`);
console.log(`Source commit: ${m.source.commit ?? 'unknown'}${m.source.uncommittedChanges ? ' (with uncommitted changes)' : ''}`);
