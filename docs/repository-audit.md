# Repository Audit (2026-10-26)

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last Updated:** 2026-10-26  
> **Status:** Active (snapshot of master at 59d3804, before the workflow foundation)

## What the site is

A single static page, `KenGranderson/index.html`, built on the FreeHTML5 "Profile" Bootstrap 3 template. Everything else in `KenGranderson/` is assets. There is no server-side code and no database at run time.

- **Scripts** (all local, under `lib/` and `js/`): jQuery 3.4.1 with jquery-migrate, jquery-easing, Bootstrap 3.4.1, Waypoints, Stellar, Modernizr, Magnific Popup, Media Boxes, EasyPieChart, and the template's `js/main.js`. `libman.json` records where the `lib/` packages came from (cdnjs); the files themselves are committed.
- **External**: Google Fonts and embedded YouTube videos.
- **Styles**: `css/style.css` compiled from `sass/style.scss` by the Visual Studio Web Compiler extension (`compilerconfig.json`). The compiled CSS is committed.

## How content is loaded

An inline script at the bottom of `index.html` calls `$.getJSON('highlights.json')` and renders the timeline. `highlights.json` is an object whose keys are year headings (plus one "Visionary Projects" heading) in display order; each value is a list of entries with `hash` (anchor name), `title`, and optional `subTitle`, `description` (HTML allowed), `mediaUrls`, and `postscript`. In `mediaUrls` an entry with a dot is a site-relative file (images open in a lightbox; .pdf, .pps, .ppsx show an icon link), an entry without a dot is a YouTube id, and two entries are https links.

At the time of the audit: 23 headings, 87 entries.

Pre-existing issues found (left unchanged; they are historical material):

- `images/highlights/ica.png` (1996, `ica`), `images/highlights/bfo1.jpg` (2017, `blackfacts`), and `images/civicchat-demo.jpg` (Visionary Projects, `civicchat`) do not exist. They return 404 on the built site. A `civicchat-demo.jpg` exists under `images/highlights/`.
- The anchor `350years` is used twice (1995 and 2021), so a `#350years` link always lands on the first.

## generatejson (removed)

A .NET Framework 4.7.2 console app that ran `SELECT Year, Title, SubTitle, Description, Media, PostScript FROM Highlights` against a SQL Server database (`Data Source=INKOSI; Initial Catalog=KenGranderson`, Windows authentication), grouped rows by year, turned the comma-separated `Media` column into `mediaUrls` (prefixing `images/highlights/` to file names), and wrote `highlights.json` to a hard-coded path on Ken's workstation.

That makes the committed `highlights.json` the only copy of the timeline the repository has; the database is not reachable from here. It is now edited directly and validated by the build. The project was removed at Ken's request (2026-10-26); it remains in Git history before this change.

## build.cmd (removed)

Recreated a `work/` folder and copied `capri-service-manual`, `css`, `fonts`, `images`, `js`, `lib`, `media`, `share`, `photos`, `kendudeism`, plus `favicon.ico`, `highlights.json`, and `index.html` into it. It skipped `projects/`, which the live site may link to, so the new build copies everything except development files instead (see below). Removed at Ken's request; replaced by `npm run build`.

## Other root files

- `CLAUDE-PROJECT-GOAL.txt`: a two-sentence project goal. Removed; its content is in `AGENTS.md` and `.blackfacts/project.yml`.
- `README.md`: the public README, which is also Ken's GitHub profile README. Kept unchanged.
- `kengranderson.code-workspace`: a VS Code workspace that opens this repo next to `../Wakanda.Tools`. Kept; it is Ken's local editor setup.
- `.gitignore`: the standard Visual Studio ignore file. Kept, with `node_modules/`, `dist/`, and `dist-*/` added.

## Legacy hosting files (kept in `KenGranderson/`, not published)

`KenGranderson.sln` (Visual Studio website project; its references to generatejson and build.cmd were removed), `Web.config` and `Web.Debug.config` (ASP.NET 4.7.2 settings), `media/Web.config` and `photos/web.config` (turn on IIS directory listings for those folders), `App_Data/PublishProfiles/Production.pubxml` (MSDeploy to `kengranderson.com`, IIS site "Ken Granderson"; no password stored), `packages.config`, `libman.json`, `compilerconfig.json*`, `sass/`, and the template's `README.txt`.

They are left in place so the Visual Studio workflow still opens, but the new build does not copy them to the server. One consequence: the IIS directory listings for `/media/` and `/photos/` will not exist on a non-IIS host (see `docs/decisions.md`).

## Automation that existed

No GitHub Actions, no tests, no validation. Deployment was MSDeploy from Visual Studio to an IIS server, plus the TFS history; that path is legacy and not migrated.

## Size

`KenGranderson/` is about 580 MB (images 283 MB, media 227 MB). The built site is 875 files, about 561 MB.
