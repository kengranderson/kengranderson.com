# The kengranderson.com site (web/)

**Author:** Claude Code for Ken Granderson
**Last updated:** 2026-10-26

React components, built with Vite and **pre-rendered to static HTML at build time**. Every page is complete HTML that search engines and AI agents can read without running JavaScript; the small React bundle then makes filters, search, the mobile menu and video embeds interactive. No server, no database, no CMS.

Design reference: the "KenGranderson.com Redesign" canvas (design system + every page at desktop and phone size).

## To change content, edit JSON. Not code.

| What | Where |
|---|---|
| Timeline / archive entries | `KenGranderson/highlights.json` (unchanged format; an entry's `hash` is its permanent link, e.g. `timeline/#blackfacts97`) |
| Projects (Work pages) | `KenGranderson/content/work/<slug>.json`, one file per project |
| Essays | `KenGranderson/content/philosophy/<slug>.json`; order and titles in `_principles.json` |
| Home, Connect, nav, links, footer | `KenGranderson/content/site.json` |

Every record has `"publish": "draft" | "review" | "published"`.

- **Preview builds** (`SITE_MODE=preview`, the current default and what the bluehost-preview deploy uses) show everything, plus yellow VERIFY flags, `needs` lists and placeholders like `[YEAR]`. Pages are marked `noindex`.
- **Production builds** (`SITE_MODE=production`) show only `published` records and hide every editorial flag.

### A project record

```json
{
  "slug": "roxbury",                       // URL: work/roxbury/
  "title": "Roxbury.com",
  "publish": "review",
  "status": "archived",                    // live | maintained | archived | null (unknown)
  "years": { "start": 2002, "end": null },
  "summary": "…",                          // project page lede
  "cardSummary": "…",                      // optional shorter text for cards
  "served": "Roxbury residents, …",
  "image": "images/highlights/roxbury.jpg",
  "lineage": { "from": "inner-city-access", "to": "sankori-henson-56" },
  "principles": ["duty-and-opportunity"],  // essay slugs
  "highlights": ["2002/roxbury"],          // "<year>/<hash>" in highlights.json: supplies the evidence
  "verify": ["claim that needs a source"], // preview only
  "needs": ["facts Ken still has to supply"] // preview only
}
```

Optional: `flagship` (the Home feature), `proof` + `proofTitle` (the "Since 1992" strip on Home), `place`, `platform`, `role`, `url`, `features`, `lineageTitle`, `imageAlt`, `imageFit: "contain"`.

A project page is the record **plus the timeline entries it lists in `highlights`**: their videos, screenshots, clippings and documents become the page's exhibits. Add evidence once in `highlights.json` and it shows on both the timeline and the project.

## Build

```bash
scripts/build-site.sh            # from the repo root: legacy files + this site → _site/
SITE_MODE=production scripts/build-site.sh
```

`build-site.sh` copies the legacy folders, renames the old one-page site to `classic.html`, runs `npm run build` here, copies `web/dist/site/` on top, and fails on any page linking to a missing local file. GitHub Actions runs the same script on every push to `master` (see `DEPLOY.md`).

Inside `web/`, `npm run build` does three things: Vite builds the client bundle (`dist/client`), Vite builds the server renderer (`dist/server`), and `prerender.mjs` writes one `index.html` per route into `dist/site`, with that page's data embedded for hydration.

## Code map

- `src/content.js`: build-time only. Reads the JSON, applies draft/published rules, defines every route and its props.
- `src/pages/*.jsx`: one component per page type (Home, Work, Project, Timeline, Philosophy, Essay, Connect).
- `src/components/ui.jsx`: the shared components (status chip, VERIFY flag, project card, video, exhibit, evidence/document link, pull quote).
- `src/components/Layout.jsx`: header, footer, preview bar.
- `src/site.css`: the one stylesheet. Tokens at the top; one block per component.

Links are always relative (`./`, `../`), so the site works from any folder on any host.

## Old links

The old site linked to `/#1997` and `/#blackfacts97`. The new Home page forwards those to the same anchor on `timeline/`. The old page itself is kept at `classic.html`.
