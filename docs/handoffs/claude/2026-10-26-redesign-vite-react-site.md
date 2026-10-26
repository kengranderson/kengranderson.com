# KenGranderson.com Redesign: Claude Code to Other Agents

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last updated:** 2026-10-26  
> **Tool authored:** Claude Code (cloud session)  
> **Audience:** ChatGPT, Claude Code, and any other agent continuing KenGranderson.com work  
> **Status:** Active. This describes what is on `master` as of PR #6.

Read this before changing the website. It records what was built in the redesign thread on 2026-10-26, why, what is still open, and the traps that cost time. Ken's own requirements are in [the 2026-10-25 kickoff handoff](../2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md); this document says where the implementation follows it and where Ken has since decided differently.

---

## 1. The short version

- **The live preview site is the new design.** `master` builds a Vite + React site that is **pre-rendered to static HTML** at build time, layered over the legacy files, and deployed by GitHub Actions to Bluehost **preview** hosting (the temporary Bluehost address stored as `DEPLOY_URL` in the `bluehost-preview` GitHub environment; Ken has it). `kengranderson.com` itself has **not** been switched over; that DNS cutover waits on Ken.
- **Content is JSON.** `KenGranderson/highlights.json` (timeline, unchanged format) plus `KenGranderson/content/` (work, philosophy, story, site-wide text). Agents edit JSON, not markup.
- **Three pillars are live:** My Story, My Work, My Philosophy, plus Timeline (archive) and Connect. Events is not built yet.
- **Everything is in preview mode:** drafts, yellow VERIFY flags and "Ken to supply" notes are visible and pages are `noindex`. No record is `published` yet, so a production build would be nearly empty.
- **Design reference:** the "KenGranderson.com Redesign" canvas, https://claude.ai/artifact/K6bje4DyFxWMKdi9ZX1YAT (private to Ken; design system plus every page at desktop and phone size).

---

## 2. Decisions (and what they supersede)

| # | Decision | Who / when | Notes |
|---|---|---|---|
| R-01 | **Use Vite + React, pre-rendered to static HTML.** | Ken, 2026-10-26, in this thread | **Supersedes** the kickoff's "This is not a React application" and D-01 ("Keep the site as plain HTML and jQuery") on the unmerged branch `claude/project-thread-rhxstz`. Ken's reasoning: React with Vite is his standard toolchain for modular work. Pre-rendering keeps every page as complete HTML for search engines and AI agents; React only adds interactivity after load. Still static: no server, no database, no CMS. |
| R-02 | Keep `highlights.json` as the timeline's source, same format. | Agent, kept from kickoff | Every entry's `hash` is its permanent anchor (`timeline/#blackfacts97`). Old links `/#1997` and `/#blackfacts97` are forwarded by the Home page. |
| R-03 | One JSON file per record in `KenGranderson/content/`, with `"publish": "draft" \| "review" \| "published"`. | Agent, proposed | No JSON Schema validation yet (the unmerged branch had ajv schemas; not ported). Build fails on invalid JSON and broken links. |
| R-04 | Two build modes: `SITE_MODE=preview` (default) shows everything plus editorial flags, `noindex`; `SITE_MODE=production` shows only `published` records, no flags. | Agent | The deploy workflow sets `SITE_MODE: preview`. Switch to `production` only at launch, with Ken's approval. |
| R-05 | Old one-page site kept at `/classic.html`. | Agent | Its relative paths still work from the root. |
| R-06 | Fonts are self-hosted (Anton, Source Serif 4, IBM Plex Mono via `@fontsource`, latin subsets). | Agent | No Google Fonts request; ~130 KB total. |
| R-07 | Palette black / white / one red `#D7141A`, from the Run-D.M.C.-style signage. Headings Anton; text Source Serif 4; data IBM Plex Mono. | Agent; Ken approved the direction | Heading sizes were halved at Ken's request (PR #4) and long labels get their own size (PR #5). |
| R-08 | Ken's About text from the old site is the My Story page, **wording unchanged**; agents add only headings and evidence links. | Ken, 2026-10-26 | Historical material. Do not edit his wording without approval. |
| R-09 | Contact email `ken@blackfacts.com` on Connect. | Ken, 2026-10-26 | Was already public on the old site. |
| R-10 | Fixed three broken timeline image references: `ica.png` → `ica1.png`, `bfo1.jpg` → `bfo.jpg`, added `images/civicchat-demo.jpg`. | Ken, 2026-10-26 | The only edits made to `highlights.json`. |

Still governed by the kickoff: Ken approves major design decisions, unverified public claims ("first", "largest", "before Yelp/Eventbrite"), changes to historical material, final wording of his beliefs, DNS/hosting changes, and switching on production publishing.

---

## 3. What is on `master` (merged PRs, in order)

| PR | What |
|---|---|
| [#2](https://github.com/kengranderson/kengranderson/pull/2) | (Earlier session) Deploy to Bluehost with GitHub Actions: `scripts/build-site.sh`, `.github/workflows/deploy.yml`, vendored deploy action in `.wakanda/shared-hosting-deploy`, `DEPLOY.md`. |
| [#3](https://github.com/kengranderson/kengranderson/pull/3) | The redesigned site: `web/` (Vite + React + pre-render), content JSON, pixel logo, `build-site.sh` builds the React site over the legacy files, `classic.html`. Also: self-hosted fonts, missing-image handling, the three image fixes. |
| [#4](https://github.com/kengranderson/kengranderson/pull/4) | Major heading sizes cut roughly in half. |
| [#5](https://github.com/kengranderson/kengranderson/pull/5) | Visionary Projects heading fits; long links wrap; **`npm run check:fit`** heading-fit test. |
| [#6](https://github.com/kengranderson/kengranderson/pull/6) | **My Story** page; menu order Story · Work · Philosophy · Timeline · Connect; contact email. |
| (direct commit) `f62ed43` | Ken updated `deploy.yml`: `web/**` trigger, `actions/setup-node@v5` (Node 22, npm cache), `actions/checkout@v5`, `SITE_MODE: preview`. |

---

## 4. How the site is built

```text
KenGranderson/highlights.json ─┐
KenGranderson/content/*.json  ─┼─> web/src/content.js (build-time only: draft rules, routes, props)
                               │       │
                               │       ├─ vite build            → web/dist/client (JS + CSS + fonts)
                               │       ├─ vite build --ssr      → web/dist/server (renderer)
                               │       └─ node prerender.mjs    → web/dist/site/<route>/index.html
                               │                                   (complete HTML + that page's data for hydration)
scripts/build-site.sh ─────────┴─> _site/ = legacy folders (images, media, photos, css…) 
                                           + old index.html renamed classic.html
                                           + web/dist/site on top
                                   then fails on invalid highlights.json or any page linking to a missing local file
GitHub Actions (deploy.yml) ──────> rsync _site/ to Bluehost preview folder; verifies wakanda-deploy.json
```

- **Routes built:** `/`, `/story/`, `/work/`, `/work/<slug>/` (one per visible work record), `/timeline/`, `/philosophy/`, `/philosophy/<slug>/`, `/connect/`. 18 pages in preview mode.
- **All links are relative** (`./`, `../`), so the site works from any folder or host.
- **A project page = its work record + the timeline entries it lists in `highlights`.** Those entries supply the videos, screenshots, clippings and documents. Add evidence once in `highlights.json` and it appears on both the timeline and the project.
- **Missing media** named in `highlights.json` is skipped with a `WARN` line, not rendered as a broken image.
- Full content format and code map: [`web/README.md`](../../../web/README.md).

### Commands

```bash
scripts/build-site.sh _site                     # full site (preview mode) + link check
SITE_MODE=production scripts/build-site.sh _site
cd web && npm run check:fit                     # measures every heading on every page at 360/390/768/1024/1440px;
                                                # fails on overflow, words split across lines, or sideways scroll
python3 -m http.server -d _site 8765            # look at it locally
```

Run `check:fit` after any design or content change. It needs Playwright + Chromium (preinstalled in Claude Code cloud sessions).

### Deploy

- Merge to `master` touching `KenGranderson/**`, `web/**`, `scripts/build-site.sh` or the workflow → **Deploy to Bluehost** runs automatically.
- Manual run: Actions → Deploy to Bluehost → Run workflow (untick "Dry run").
- What is live: `<preview URL>/wakanda-deploy.json` shows the deployed commit.
- Details and one-time setup: [`DEPLOY.md`](../../../DEPLOY.md).

---

## 5. Content inventory

### Pages and where their words come from

| Page | Source file | Content status |
|---|---|---|
| Home | `content/site.json` (hero, doors, video, connect band) + flagship and "Since 1992" strip from work records | Hero line and copy are agent-drafted in Ken's voice from the brief; **Ken to approve**. Signage is a placeholder. |
| My Story | `content/story.json` | Ken's original About text, unchanged. Headings, journey captions and the MIT/DJ slot are agent additions. |
| My Work | `content/work/*.json` | 11 records (below). |
| Project pages | work record + linked `highlights.json` entries | Evidence is real (from the repo). |
| Timeline | `highlights.json` | 87 entries, 23 sections, unchanged except R-10. |
| My Philosophy | `content/philosophy/_principles.json` + one essay | Only **Duty and Opportunity** exists: Ken's 1999 Salem State address, excerpted, wording unchanged, PDF linked. Four other principles are listed as "Coming". |
| Connect | `content/site.json` → `connect`, `links` | Email live. LinkedIn URL missing. |

### Work records (`KenGranderson/content/work/`)

| Slug | publish | status | start | Open items |
|---|---|---|---|---|
| `my-bed-stuy` (flagship) | review | live | — | start year, live URL, asset-map screenshot, approve summary wording |
| `timbuktu` | draft | live | — | description, start year, status, screenshot |
| `diversity-schoolhouse` | review | live | 2023 | confirm status |
| `blackfacts` | review | live | 1997 | VERIFY "Internet's First Black History Database" |
| `saint-lucia` | review | maintained | 2013 | — |
| `sankori-henson-56` | draft | maintained | — | start year, description, status |
| `roxbury` | review | archived | 2002 | Ken's description, role, end year, Wayback links |
| `airbeat` | review | *unknown* | 2000 | status |
| `inner-city-access` | review | archived | 1996 | — |
| `350-years` | review | archived | 1995 | — |
| `inner-city-software` | review | archived | 1992 | — |

**Statuses were inferred by the agent** from `highlights.json` and the brief; Ken has not confirmed them.

Lineage as implemented: Inner City Access (1996) → Roxbury.com 2.0 (2002) → Sankori / Henson 56 → My Bed-Stuy, and Inner-City Software → BlackFacts.com → Diversity Schoolhouse. The kickoff dates Roxbury.com v2 as "approximately 2001–2002"; the record says 2002 (from `highlights.json`).

---

## 6. Waiting on Ken (nothing here blocks the build)

Shown as yellow notes on the preview site; hidden in production.

1. **My Story:** write the MIT / DJ chapter; keep or reword "Highlights section below"; fix or keep the original typo "I as like to say"; approve the chapter headings and journey captions.
2. **My Bed-Stuy:** live URL, start year, asset-map screenshot, approve the summary. The kickoff names four features (community asset map, community calendar, Ask My Bed-Stuy, community news); the page currently shows only the asset map, so add the other three when Ken supplies details.
3. **Signage:** the red/white/black "Unapologetically Black Technology" image file (Home hero slot is a placeholder).
4. **Timbuktu, Sankori / Henson 56:** descriptions, years, statuses.
5. **Roxbury.com:** Ken's role, a description of what the site did, end year, Wayback Machine links.
6. **Statuses** for every project; **AirBeat** is unknown.
7. **Sources for VERIFY-flagged claims:** "Internet's First Black History Database" (1997), "Probably the First Black Microsoft MVP" (1997), "First Boston TV technology presentation by Black people" (1997). These come from Ken's own `highlights.json` subtitles.
8. **LinkedIn URL.**
9. **Philosophy:** source material for the remaining principles (technological self-determination, Techie-chagulia, outcomes over income, ownership). Per the kickoff, the GrpIcon help file and Duty and Opportunity are the primary sources, and the taxonomy waits for that review.
10. **Publish:** move approved records from `review` to `published`, then approve switching the deploy to `SITE_MODE: production`.
11. **DNS cutover:** point kengranderson.com at Bluehost (see `DEPLOY.md`, "Not part of this").

## 7. Not built yet

- **Events page** (talks, awards, press, documents). The nav entry exists in `site.json` but is hidden until a page exists. The kickoff describes the record shape (date, title, location, role, description, documents, recordings, sources).
- **JSON Schema validation** of content records (the unmerged branch has an ajv-based version worth porting).
- **Timeline type filters** (Project / Award / Press / Talk): needs an optional `type` field on `highlights.json` entries; the UI already shows `type` when present.
- **Duplicate `350years` anchor** (1995 and 2021). The 2021 entry gets id `350years-2021`; old links resolve to 1995, as before.

---

## 8. Relationship to the other branch (`claude/project-thread-rhxstz`)

An earlier Claude session built a different foundation on `claude/project-thread-rhxstz` (PR #1, **closed, not merged**): root-level `content/` with JSON Schemas, `npm run check`, a gated SSH publish workflow parked in `tools/ci/`, `AGENTS.md`, `docs/decisions.md` (D-01 to D-08), `.blackfacts/CURRENT.md`, and a repository audit. It also removed `build.cmd`, `generatejson/` and `CLAUDE-PROJECT-GOAL.txt`.

**None of that is on `master`.** `master` uses `scripts/build-site.sh` + `deploy.yml` (PR #2) and `KenGranderson/content/` (this thread). `build.cmd`, `generatejson/` and `CLAUDE-PROJECT-GOAL.txt` still exist on `master`. Treat that branch as a source of ideas (schemas, decision log, audit), not as current state. Its D-01 ("plain HTML and jQuery") is superseded by R-01. Ken's kickoff handoff from that branch has been copied to `master` unchanged: [`docs/handoffs/2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md`](../2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md).

---

## 9. Traps for agents (learned the hard way)

- **Cloud sessions cannot push `.github/workflows/*`.** GitHub refuses OAuth pushes without `workflow` scope. Hand workflow edits to Ken (GitHub web editor, pencil icon, commit to `master`).
- **In this cloud setup, GitHub MCP and `gh` may not be authenticated.** If you cannot open PRs, push the branch and give Ken the `https://github.com/kengranderson/kengranderson/pull/new/<branch>` link. The public REST API (`api.github.com/repos/.../actions/runs`, `/pulls`) works without auth for read-only checks.
- **Shallow clones track only `master`.** After pushing a branch, add a fetch refspec (`git config --add remote.origin.fetch +refs/heads/<b>:refs/remotes/origin/<b>`) or status checks will claim it is unpushed. Remove stale refspecs for deleted branches, or `git fetch` fails and later checks read old data.
- **npm registry access depends on the cloud environment's network policy**, and can be very slow (minutes per large package). `web/package-lock.json` is committed; use `npm ci`.
- **Do not `pkill -f` a pattern that also appears in your own command line**; it kills your shell.
- **Before telling Ken something deployed, check the Actions run**, not just the merge. Until Ken's commit `f62ed43` the workflow ignored `web/**` changes (PR #4 merged but did not deploy); it now includes them.
- **Never use rendered size alone to judge layout.** Run `npm run check:fit`; it caught a sideways-scroll bug that screenshots missed.
- **Do not edit Ken's historical wording** (`highlights.json` text, `story.json` paragraphs, the Duty and Opportunity essay) without his approval. Fix structure around it instead.
- The root `README.md` doubles as Ken's GitHub profile README (kickoff). Keep it that way.

---

## 10. Suggested next steps (in order)

1. Ken works through §6, starting with the My Story items and My Bed-Stuy details.
2. Build the **Events** page from `highlights.json` entries plus a small `content/events/` collection.
3. Port JSON Schema validation from `claude/project-thread-rhxstz` into `scripts/build-site.sh` for `KenGranderson/content/`.
4. Add the remaining My Bed-Stuy features to its project page once Ken supplies them.
5. When Ken approves records, mark them `published`, switch `SITE_MODE` to `production`, then plan the DNS cutover.
