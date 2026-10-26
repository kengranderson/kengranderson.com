/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Tests for content validation and the deterministic build, run against small fixture repositories.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { buildSite, localReferences } from '../lib/build.mjs';
import { REPO_ROOT } from '../lib/config.mjs';
import { validateRepository } from '../lib/content.mjs';

const tempDirs = [];
after(() => tempDirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

const write = (root, relative, value) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
};

const approval = { approvedBy: 'Test Approver', approvedOn: '2026-01-01' };
const source = { description: 'test fixture' };

/** A minimal repository using the real schemas and collection registry. */
function fixture({ records = {}, highlights } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kg-site-'));
  tempDirs.push(root);
  fs.cpSync(path.join(REPO_ROOT, 'content', 'schemas'), path.join(root, 'content', 'schemas'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'content', 'collections.json'), path.join(root, 'content', 'collections.json'));
  write(root, 'KenGranderson/index.html', '<html><link href="css/site.css"><script src="js/app.js"></script></html>');
  write(root, 'KenGranderson/css/site.css', 'body{}');
  write(root, 'KenGranderson/js/app.js', '');
  write(root, 'KenGranderson/images/photo.jpg', 'jpg');
  write(root, 'KenGranderson/Web.config', '<configuration />');
  write(root, 'KenGranderson/App_Data/PublishProfiles/Production.pubxml', '<Project />');
  write(root, 'KenGranderson/highlights.json', highlights ?? { 2002: [{ hash: 'a', title: 'A', mediaUrls: ['images/photo.jpg', 'kocxeo1Txk0'] }] });
  for (const [relative, value] of Object.entries(records)) {
    write(root, `content/${relative}`, value);
  }
  return root;
}

const messages = (result) => result.errors.map((e) => `${e.file}: ${e.message}`).join('\n');

test('the repository content itself is valid', () => {
  const result = validateRepository(REPO_ROOT);
  assert.equal(result.errors.length, 0, messages(result));
});

test('valid draft and published records pass', () => {
  const root = fixture({
    records: {
      'work/alpha.json': { id: 'alpha', status: 'draft', title: 'Alpha', sources: [source], media: [{ path: 'images/photo.jpg' }] },
      'events/beta.json': { id: 'beta', status: 'published', kind: 'award', date: '1999-02', title: 'Beta', summary: 'S', sources: [source], approval }
    }
  });
  const result = validateRepository(root);
  assert.equal(result.errors.length, 0, messages(result));
  assert.equal(result.records.work.length, 1);
  assert.equal(result.records.events.length, 1);
});

test('malformed JSON fails with the file name', () => {
  const root = fixture({ records: { 'work/broken.json': '{ "id": "broken", ' } });
  const result = validateRepository(root);
  assert.match(messages(result), /content\/work\/broken\.json: malformed JSON/);
});

test('schema violations are reported clearly', () => {
  const root = fixture({
    records: {
      'work/alpha.json': { id: 'alpha', status: 'final', title: 'Alpha', sources: [source], colour: 'red' },
      'events/beta.json': { id: 'beta', status: 'draft', kind: 'event', date: '2002-13', title: 'Beta', sources: [source] }
    }
  });
  const text = messages(validateRepository(root));
  assert.match(text, /work\/alpha\.json: \/status: must be one of draft, review, published/);
  assert.match(text, /work\/alpha\.json: \(record\): unknown field "colour"/);
  assert.match(text, /events\/beta\.json: \/date: must match pattern/);
});

test('id must match the file name', () => {
  const root = fixture({ records: { 'work/alpha.json': { id: 'gamma', status: 'draft', title: 'A', sources: [source] } } });
  assert.match(messages(validateRepository(root)), /id "gamma" must match the file name "alpha"/);
});

test('published records need approval, a summary, and sources', () => {
  const root = fixture({ records: { 'work/alpha.json': { id: 'alpha', status: 'published', title: 'A', sources: [] } } });
  const text = messages(validateRepository(root));
  assert.match(text, /must have required property 'approval'/);
  assert.match(text, /must have required property 'summary'/);
  assert.match(text, /\/sources: must NOT have fewer than 1 items/);
});

test('related links must resolve, and published records may only link to published records', () => {
  const root = fixture({
    records: {
      'work/alpha.json': { id: 'alpha', status: 'published', title: 'A', summary: 'S', sources: [source], approval, related: ['philosophy/beta', 'events/missing'] },
      'philosophy/beta.json': { id: 'beta', status: 'draft', title: 'B', sources: [source] }
    }
  });
  const text = messages(validateRepository(root));
  assert.match(text, /related "events\/missing" does not match any record/);
  assert.match(text, /links to "philosophy\/beta", which is not published/);
});

test('media paths are checked case-sensitively', () => {
  const root = fixture({ records: { 'work/alpha.json': { id: 'alpha', status: 'draft', title: 'A', sources: [source], media: [{ path: 'images/Photo.jpg' }] } } });
  assert.match(messages(validateRepository(root)), /media path "images\/Photo\.jpg" does not exist/);
});

test('legacy highlights: structural errors fail, historical data issues warn', () => {
  const broken = validateRepository(fixture({ highlights: { 2002: [{ title: 'No hash' }] } }));
  assert.match(messages(broken), /highlights\.json: \/2002\/0: must have required property 'hash'/);

  const warned = validateRepository(fixture({
    highlights: { 2001: [{ hash: 'x', title: 'X' }], 2002: [{ hash: 'x', title: 'Y', mediaUrls: ['images/missing.jpg'] }] }
  }));
  assert.equal(warned.errors.length, 0, messages(warned));
  const warnings = warned.warnings.map((w) => w.message).join('\n');
  assert.match(warnings, /duplicate anchor "x"/);
  assert.match(warnings, /media file "images\/missing\.jpg" not found/);
});

test('build excludes drafts and dev-only files, strips editor notes, and is deterministic', () => {
  const root = fixture({
    records: {
      'work/alpha.json': { id: 'alpha', status: 'draft', title: 'A', sources: [source] },
      'work/beta.json': { status: 'published', id: 'beta', title: 'B', summary: 'S', sources: [source], approval, editorNotes: 'internal' }
    }
  });
  const out1 = path.join(root, 'out1');
  const out2 = path.join(root, 'out2');
  const first = buildSite({ root, outDir: out1 });
  const second = buildSite({ root, outDir: out2 });
  assert.equal(first.errors.length, 0, messages(first));

  const content = JSON.parse(fs.readFileSync(path.join(out1, 'data/content.json'), 'utf8'));
  assert.deepEqual(content.collections.work.map((r) => r.id), ['beta']);
  assert.equal(content.collections.work[0].editorNotes, undefined);
  assert.equal(content.includesDrafts, false);

  assert.ok(fs.existsSync(path.join(out1, 'index.html')));
  assert.ok(fs.existsSync(path.join(out1, 'highlights.json')));
  assert.ok(!fs.existsSync(path.join(out1, 'Web.config')));
  assert.ok(!fs.existsSync(path.join(out1, 'App_Data')));

  for (const file of ['build-manifest.json', 'data/content.json']) {
    assert.equal(fs.readFileSync(path.join(out1, file), 'utf8'), fs.readFileSync(path.join(out2, file), 'utf8'), `${file} differs between builds`);
  }
  assert.deepEqual(first.manifest.records.work, { total: 2, included: 1 });
  assert.equal(second.manifest.includesDrafts, false);
});

test('preview build includes drafts and says so', () => {
  const root = fixture({ records: { 'work/alpha.json': { id: 'alpha', status: 'draft', title: 'A', sources: [source] } } });
  const result = buildSite({ root, outDir: path.join(root, 'preview'), includeDrafts: true });
  assert.equal(result.manifest.includesDrafts, true);
  const content = JSON.parse(fs.readFileSync(path.join(root, 'preview/data/content.json'), 'utf8'));
  assert.equal(content.collections.work.length, 1);
});

test('a failed validation writes nothing', () => {
  const root = fixture({ records: { 'work/broken.json': '{' } });
  const outDir = path.join(root, 'out');
  const result = buildSite({ root, outDir });
  assert.ok(result.errors.length > 0);
  assert.ok(!fs.existsSync(outDir));
});

test('localReferences finds literal local assets and skips external and scripted ones', () => {
  const html = `<a href="#top"></a><link href="css/a.css?v=1"><img src="/favicon.ico"><a href="https://x.org">
    <script src="//cdn.example/x.js"></script><div style="background-image:url(images/bg.jpg);"></div>
    <a href="mailto:x@y.z"></a> html = '<a href="' + mediaUrl + '">'`;
  assert.deepEqual(localReferences(html), ['css/a.css', 'favicon.ico', 'images/bg.jpg']);
});
