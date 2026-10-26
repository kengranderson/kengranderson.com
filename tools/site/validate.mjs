#!/usr/bin/env node
/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Validate content records and the legacy highlights timeline. Exit 1 on any error.
 *          Usage: node tools/site/validate.mjs [--strict]   (--strict also fails on warnings)
 */

import { REPO_ROOT } from './lib/config.mjs';
import { validateRepository } from './lib/content.mjs';
import { printProblems } from './lib/report.mjs';

const strict = process.argv.includes('--strict');
const result = validateRepository(REPO_ROOT);
printProblems(result);

const summary = Object.entries(result.records)
  .map(([name, items]) => `${name}: ${items.length} (${items.filter((r) => r.status === 'published').length} published)`)
  .join(', ');
console.log(`Content records valid: ${summary}`);
console.log(`${result.errors.length} error(s), ${result.warnings.length} warning(s).`);

if (result.errors.length || (strict && result.warnings.length)) {
  process.exit(1);
}
