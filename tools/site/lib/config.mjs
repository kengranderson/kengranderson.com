/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Repository layout and publishing rules shared by the validate and build commands.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Folder (relative to the repository root) holding the static website as served. */
export const SITE_DIR = 'KenGranderson';

/** Folder holding the JSON content source records and schemas. */
export const CONTENT_DIR = 'content';

/** Build output folder. Gitignored. */
export const DIST_DIR = 'dist';

/** Legacy timeline read by index.html, relative to SITE_DIR. */
export const HIGHLIGHTS_FILE = 'highlights.json';

/** Generated content file, relative to the build output. */
export const CONTENT_OUTPUT = 'data/content.json';

/** Build manifest, relative to the build output. */
export const MANIFEST_OUTPUT = 'build-manifest.json';

/**
 * Files and folders in SITE_DIR that are development or IIS-only artifacts and are not
 * copied to the static build. Matched against the path relative to SITE_DIR.
 */
export const SITE_EXCLUDES = [
  /^App_Data(\/|$)/,
  /^sass(\/|$)/,
  /^KenGranderson\.sln$/,
  /^README\.txt$/,
  /^compilerconfig\.json(\.defaults)?$/,
  /^libman\.json$/,
  /^packages\.config$/,
  /(^|\/)web(\.debug)?\.config$/i,
  /(^|\/)desktop\.ini$/i,
  /(^|\/)thumbs\.db$/i,
  /\.psp$/i
];
