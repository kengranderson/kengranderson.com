/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Load and validate JSON content records and the legacy highlights timeline.
 */

import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { CONTENT_DIR, HIGHLIGHTS_FILE, SITE_DIR } from './config.mjs';

const HIGHLIGHTS_SCHEMA_ID = 'https://kengranderson.com/schemas/legacy-highlights.schema.json';
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function readJson(file, problems, label = file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    problems.push({ file: label, message: `cannot read file: ${error.message}` });
    return undefined;
  }
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch (error) {
    problems.push({ file: label, message: `malformed JSON: ${error.message}` });
    return undefined;
  }
}

function createValidator(root, errors) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  const schemaDir = path.join(root, CONTENT_DIR, 'schemas');
  for (const name of fs.readdirSync(schemaDir).filter((f) => f.endsWith('.json')).sort()) {
    const schema = readJson(path.join(schemaDir, name), errors, `${CONTENT_DIR}/schemas/${name}`);
    if (schema) {
      ajv.addSchema(schema);
    }
  }
  return ajv;
}

function describeAjvErrors(ajvErrors) {
  return ajvErrors
    .filter((e) => e.keyword !== 'if')
    .map((e) => {
      const where = e.instancePath || '(record)';
      if (e.keyword === 'additionalProperties') {
        return `${where}: unknown field "${e.params.additionalProperty}"`;
      }
      if (e.keyword === 'enum') {
        return `${where}: must be one of ${e.params.allowedValues.join(', ')}`;
      }
      return `${where}: ${e.message}`;
    });
}

/** Exact, case-sensitive existence check, so links that work on Windows/IIS but break on Linux hosts are caught. */
export function existsExactCase(root, relativePath) {
  const parts = relativePath.split('/').filter(Boolean);
  let current = root;
  for (const part of parts) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch {
      return false;
    }
    if (!entries.includes(part)) {
      return false;
    }
    current = path.join(current, part);
  }
  return true;
}

/**
 * Validate everything under the given repository root.
 * Returns { errors, warnings, records } where records maps collection name to an array of records.
 */
export function validateRepository(root) {
  const errors = [];
  const warnings = [];
  const rel = (file) => path.relative(root, file).split(path.sep).join('/');
  const siteRoot = path.join(root, SITE_DIR);

  const ajv = createValidator(root, errors);
  const registry = readJson(path.join(root, CONTENT_DIR, 'collections.json'), errors, `${CONTENT_DIR}/collections.json`);
  const records = {};
  const index = new Map();

  for (const collection of registry?.collections ?? []) {
    const validate = ajv.getSchema(collection.schema);
    if (!validate) {
      errors.push({ file: rel(path.join(root, CONTENT_DIR, 'collections.json')), message: `collection "${collection.name}" refers to unknown schema ${collection.schema}` });
      continue;
    }
    records[collection.name] = [];
    const dir = path.join(root, CONTENT_DIR, collection.directory);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
    for (const name of files) {
      const file = path.join(dir, name);
      if (!name.endsWith('.json')) {
        errors.push({ file: rel(file), message: 'only .json record files belong in a collection folder' });
        continue;
      }
      const record = readJson(file, errors, rel(file));
      if (record === undefined) {
        continue;
      }
      const recordProblems = [];
      if (!validate(record)) {
        recordProblems.push(...describeAjvErrors(validate.errors));
      }
      const expectedId = name.slice(0, -'.json'.length);
      if (record && typeof record === 'object' && record.id !== expectedId) {
        recordProblems.push(`id "${record.id}" must match the file name "${expectedId}"`);
      }
      for (const item of record?.media ?? []) {
        if (typeof item?.path === 'string' && !existsExactCase(siteRoot, item.path)) {
          recordProblems.push(`media path "${item.path}" does not exist in ${SITE_DIR}/ (paths are case-sensitive)`);
        }
      }
      for (const source of record?.sources ?? []) {
        if (typeof source?.path === 'string' && !existsExactCase(root, source.path)) {
          recordProblems.push(`source path "${source.path}" does not exist in the repository`);
        }
      }
      if (recordProblems.length) {
        errors.push(...recordProblems.map((message) => ({ file: rel(file), message })));
        continue;
      }
      records[collection.name].push(record);
      index.set(`${collection.name}/${record.id}`, { record, file: rel(file) });
    }
  }

  for (const [key, { record, file }] of index) {
    for (const ref of record.related ?? []) {
      const target = index.get(ref);
      if (!target) {
        errors.push({ file, message: `related "${ref}" does not match any record` });
      } else if (ref === key) {
        errors.push({ file, message: 'a record cannot be related to itself' });
      } else if (record.status === 'published' && target.record.status !== 'published') {
        errors.push({ file, message: `published record links to "${ref}", which is not published` });
      }
    }
  }

  validateHighlights(root, ajv, errors, warnings);
  return { errors, warnings, records };
}

function validateHighlights(root, ajv, errors, warnings) {
  const siteRoot = path.join(root, SITE_DIR);
  const file = path.join(siteRoot, HIGHLIGHTS_FILE);
  const label = path.relative(root, file).split(path.sep).join('/');
  const highlights = readJson(file, errors, label);
  if (highlights === undefined) {
    return;
  }
  const validate = ajv.getSchema(HIGHLIGHTS_SCHEMA_ID);
  if (!validate(highlights)) {
    errors.push(...describeAjvErrors(validate.errors).map((message) => ({ file: label, message })));
    return;
  }
  // Pre-existing data issues are warnings: the timeline is historical material and is not altered without approval.
  const seen = new Map();
  for (const [heading, items] of Object.entries(highlights)) {
    for (const item of items) {
      const where = `${heading} / ${item.hash}`;
      if (seen.has(item.hash)) {
        warnings.push({ file: label, message: `${where}: duplicate anchor "${item.hash}" (also under ${seen.get(item.hash)})` });
      } else {
        seen.set(item.hash, heading);
      }
      for (const media of item.mediaUrls ?? []) {
        if (/^https?:\/\//.test(media)) {
          continue;
        }
        if (!media.includes('.')) {
          if (!YOUTUBE_ID.test(media)) {
            warnings.push({ file: label, message: `${where}: "${media}" is neither a file path nor a YouTube id` });
          }
          continue;
        }
        if (!existsExactCase(siteRoot, media)) {
          warnings.push({ file: label, message: `${where}: media file "${media}" not found (paths are case-sensitive)` });
        }
      }
    }
  }
}

/** Remove internal-only fields from a record before publishing. */
export function toPublicRecord(record) {
  const { $schema, editorNotes, ...rest } = record;
  return rest;
}
