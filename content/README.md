# Content Source Records

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last Updated:** 2026-10-26  
> **Status:** Draft (first version of the content model)

Site content is kept as small JSON files, one record per file, so a person can edit one in any text editor and an agent can change one without touching anything else. The build validates every record and writes the published ones to `dist/data/content.json`.

The existing timeline (`KenGranderson/highlights.json`) is separate and unchanged. It is still what the home page reads. Moving any of it into these records is editorial work for later, with Ken's approval.

## Layout

```text
content/
  collections.json            which collections exist, their folders and schemas
  schemas/                    JSON Schema (2020-12) for each collection, plus shared definitions
  work/<id>.json              My Work: things built, delivered, maintained
  philosophy/<id>.json        My Philosophy: principles, writings, reflections
  events/<id>.json            Events, presentations, awards, press, documents, life events
```

My Story has no collection yet. Add one when its shape is known (see "Adding a collection").

## Fields every record shares

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable kebab-case id, identical to the file name. Never rename a published id; other records link to it. |
| `status` | yes | `draft` or `review` (never published) or `published`. |
| `title` | yes | Plain title. |
| `sources` | yes | Where the information comes from: `description`, plus `path` (in this repo) or `url`, and `verified: true` only once checked. |
| `summary` | to publish | One or two plain sentences. |
| `body` | no | Longer text. |
| `related` | no | Links to other records as `collection/id`, e.g. `work/my-bed-stuy`. |
| `media` | no | Each item has one of `path` (a file inside `KenGranderson/`, checked to exist, case-sensitive), `url`, or `youtube` (video id), plus an optional `caption`. |
| `approval` | to publish | `{ "approvedBy": "Ken Granderson", "approvedOn": "YYYY-MM-DD" }`. Added only on Ken's instruction. |
| `editorNotes` | no | Internal notes. Never published. |

Dates use the precision actually known: `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`.

Collection-specific fields:

- **work**: `period` (`start`, `end`, `ongoing`), `role`, `features` (list), `links` (`url` + `label`).
- **philosophy**: `originalDate`. No categories or tags yet; the taxonomy waits for the source review.
- **events**: `kind` (event, presentation, award, press, document, life-event) and `date` are required; `endDate`, `location`, `role` are optional.

Each file starts with `"$schema": "../schemas/<name>.schema.json"`, so VS Code and similar editors check it as you type.

## Rules the validator enforces

- Malformed JSON, unknown fields, missing required fields, and bad dates fail the build, with the file name and the field.
- `id` must match the file name.
- `related` links must point to existing records, and a published record may link only to published records.
- `media` paths and `sources` paths must exist (exact case, because the web host is Linux).
- `published` requires `approval`, `summary`, and at least one source.
- `editorNotes` and `$schema` are stripped from the published output. Draft and review records are left out entirely unless you build a preview (`npm run build:preview`).

## Adding a record

1. Copy an existing file in the right folder, rename it to the new id, and change `id` to match.
2. Fill in what a source supports. Keep `"status": "draft"`.
3. Run `npm run validate`, then `npm run build:preview` and `npm run serve:preview` to look at it.
4. Open a pull request. Publishing it later means Ken approves, and the record gets `"status": "published"` plus an `approval` block.

## Adding a collection

1. Add `schemas/<name>.schema.json` (copy `work.schema.json` and change the collection-specific fields).
2. Register it in `collections.json`.
3. Create the folder and the first record, then run `npm test` and `npm run validate`.

No code change is needed.

## The three current records are examples

`work/my-bed-stuy.json`, `philosophy/breaking-down-information-silos.json`, and `events/roxbury-com-grand-opening-presentation.json` are drafts that exist to prove the workflow. Their wording comes from Ken's kickoff handoff or the existing timeline and is not final editorial copy.
