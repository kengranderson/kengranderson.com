# KenGranderson.com — ChatGPT Voice-to-Claude Handoff

Date: October 25, 2026

> Recorded verbatim from Ken Granderson's handoff message to Claude (project thread, 2026-10-25), with Markdown formatting added. Content unchanged.

## Immediate instruction

Create this handoff document in:

`docs/handoffs/2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md`

Repository: https://github.com/kengranderson/kengranderson

Commit and push the document before beginning implementation so it is available to other agents.

This document records decisions from an extended ChatGPT voice brainstorming session. Treat its confirmed requirements as project context, distinguish future ideas from approved implementation work, and verify repository details directly.

## Project purpose

I am developing KenGranderson.com as a living record of my work, my philosophy, and my story, using the technologies and processes I have developed to manage my other websites.

This site must be an active demonstration of my approach to technology: AI-first development, independent execution, reusable systems, and outcomes over income.

I want multiple AI agents, including ChatGPT and Claude, to maintain the website through a shared GitHub repository.

The publishing process should eventually be:

My instructions → AI agent → GitHub changes → validation and build → GitHub Actions deployment → public website.

The immediate priority is making that process operational.

Do not confuse establishing this workflow with writing the website's complete editorial content. Those are separate workstreams.

## Existing repository and architecture

Public repository:
https://github.com/kengranderson/kengranderson

Website:
https://kengranderson.com

The local working copy originated in the TFS repository `KenGranderson`, checked out locally as `kengranderson`.

The public GitHub repository was renamed from `kengranderson.com` to `kengranderson`.

The repository name matches my GitHub account name, so the root README.md also serves as my GitHub profile README. Maintain that dual purpose. Do not create a second GitHub profile repository.

A separate private repository, `kengranderson-archived`, contains older material. Leave it alone.

Existing application characteristics:

* HTML pages in the `KenGranderson` directory.
* jQuery reads `highlights.json`.
* A `generatejson` project exists.
* A root `build.cmd` exists.
* The site has no database.
* Content will be maintained as JSON text files in Git.
* This is not a React application.

Inspect these files and their relationships before proposing changes.

The existing `highlights.json` contains historical entries organized by year. Its entries use fields such as `hash`, `title`, `subTitle`, `description`, `mediaUrls`, and `postscript`.

Preserve existing content and functionality unless changes are demonstrably necessary.

Do not perform a gratuitous technology migration.

## Shared tools and development conventions

Our shared development standards are maintained in the Wakanda Tools and BlackFacts Tools repositories, especially:
https://github.com/blackfacts/tools

Inspect relevant current guidance there before building new tooling or writing project-specific conventions.

The site should follow those standards as they evolve.

Do not duplicate entire rulebooks into this repository. Reference their canonical locations and record any project-specific exceptions or decisions.

Our documentation convention uses a top-level `docs` directory, including `docs/handoffs` for information passed between AI tools.

Keep documentation discoverable by agents working in different environments.

## Immediate development objectives

### A. Repository audit

Inspect the actual repository structure, including:

* HTML pages and JavaScript dependencies.
* JSON content and how it is loaded.
* The generatejson project.
* Existing build scripts and generated artifacts.
* Media assets and relative paths.
* Existing GitHub Actions, if any.
* Existing documentation and deployment configuration.

Document what exists before replacing or extending anything.

### B. Human- and AI-editable content

Determine how best to organize individual JSON source files for content that will eventually represent:

* My Story.
* My Work.
* My Philosophy.
* Events, presentations, awards, and supporting documents.

The source format must be simple enough for a person to edit and structured enough for agents to maintain reliably.

Consider stable IDs, dates, relationships, provenance, media references, and draft/published status.

Do not build an unnecessarily complicated content-management system.

Inspect `generatejson` before deciding whether to extend or replace its functionality.

### C. Build and validation

Establish a reproducible build that:

1. Validates source JSON.
2. Generates whatever published JSON or static artifacts the website requires.
3. Preserves existing assets and working functionality.
4. Fails clearly when content is malformed.
5. Can run through GitHub Actions.
6. Does not require a database.

The generation process should be deterministic and repeatable.

### D. GitHub Actions and deployment

Establish the new GitHub-based build and publishing workflow.

The existing Apache and TFS publishing process is legacy infrastructure and is not a migration requirement.

Do not spend time reverse-engineering the legacy deployment unless something genuinely relevant remains in the repository.

Choose a suitable modern deployment strategy for a static HTML/JavaScript website, consistent with our shared tools conventions.

Use GitHub Actions for validation and automated deployment.

Do not assume an existing hosting provider must be retained.

Where DNS, hosting credentials, repository secrets, costs, or public cutover decisions are required, document the options and request my approval.

The deployment workflow should initially be safe to test without unintentionally replacing the live site.

### E. Agent workflow

Make the repository usable by authorized AI agents.

An agent should be able to:

1. Read the applicable project and shared-tool instructions.
2. Identify the correct JSON source file.
3. Add or edit content.
4. Validate and build locally or in CI.
5. Commit and push changes through an approved workflow.
6. Confirm what was published.
7. Document the result for other agents.

Support small, incremental operations rather than requiring a full website rebuild for every content update.

Use branches or pull requests where review is appropriate.

## Site vision — context for future development

The website is intended to demonstrate my decades of pioneering, independent technology delivery for communities of color and other underserved communities.

I want visitors to reach their own conclusions about my work.

The website should provide convincing evidence rather than overt claims about my brilliance, my deserving investment, or the resources others should have provided.

It should encourage discovery and potential collaboration, not follower-building.

The site has three primary conceptual pillars:

### My Story

My personal journey and technological accomplishments are inseparable.

This section should serve as an introduction and prelude to my forthcoming book, Unapologetically Black Technology.

It should not attempt to reproduce the entire book.

### My Work

A record of what I've actually developed, delivered, and maintained, including both historical and current projects.

The emphasis is on functioning technology, pioneering ideas, community impact, and evidence.

### My Philosophy

My intellectual principles, worldview, writings, and reflections.

Principal historical sources include the GrpIcon help file and my Duty and Opportunity document.

Other writings, including future LinkedIn articles, will contribute to this collection.

Technological self-determination and Techie-chagulia are important concepts.

Do not establish a final philosophy taxonomy before we review the source documents.

These three pillars must interconnect naturally.

## Documents and life events

The website should also accommodate a growing archive of speaking engagements, awards, public presentations, historical documents, press coverage, and significant life events.

Records should link to appropriate projects, principles, and supporting media.

For example, an event might include its date, title, location, my role, description, relevant documents, recordings, and verification sources.

Build only the minimum extensible structure initially.

## Current work and historical lineage

Contemporary projects should lead the website experience.

My Bed-Stuy is especially important because it demonstrates community technology being delivered today.

Its four principal features are:

* Community asset map.
* Community calendar.
* Ask My Bed-Stuy.
* Community news.

The asset map is likely the most universally compelling visual entry point.

The calendar illustrates a particularly important philosophy: breaking down information silos, helping communities discover each other's activities, and making information available before opportunities have passed.

My Bed-Stuy is an application of a broader community technology platform intended to scale beyond Brooklyn.

The historical lineage includes:

* Version 1: Inner-City Access/Roxbury.com, beginning around 1996.
* Version 2: Roxbury.com, approximately 2001–2002.
* Version 3: The current Sankori/Henson 56 community platform, with My Bed-Stuy as its first client application.

The earlier Roxbury.com platform offered functioning self-service business and event listings years before several later prominent directory and events companies were founded.

Historical evidence includes contemporary recordings, flyers, press coverage, and archived web pages.

Verify historical comparisons before publishing them as factual claims.

Visitors should be able to explore this material voluntarily, rather than being forced through an extensive historical presentation.

## Brand identity

Unapologetically Black Technology is a highly visible component of the website's identity.

The official logo is the updated, high-resolution version of my early-1990s Black face with a high-top fade and sunglasses.

The separate red, white, and black Unapologetically Black Technology signage draws visual inspiration from Run-D.M.C.

Use existing approved assets. Do not invent substitute logos.

The writing style should be plain, confident, uncompromising, and direct.

Straight no chaser.

## Editorial source repository

The Unapologetically Black Technologist Google Shared Drive contains essential background material:
https://drive.google.com/drive/u/0/folders/0AAZTJsX_aKfpUk9PVA

Its Master Writer Brief explains the book, brand, and intellectual direction.

The Drive includes separate areas for philosophy, biography, projects, history, creative assets, and book development.

This is contextual source material, not permission to publish everything in the Drive.

The content deep dive will be undertaken separately with ChatGPT.

## What agents may change

Agents may inspect the repository, document its architecture, add safe tooling, improve validation, create source schemas and example draft content, and implement reversible build processes.

Agents should document and test changes.

My explicit approval is required for major design decisions, unverified public claims, alteration or deletion of historical materials, final editorial language representing my beliefs, domain or hosting changes, paid services, access permissions, and activation of public deployment.

Preserve approved brand assets and original historical material.

Do not commit passwords, tokens, credentials, or other secrets.

## First practical deliverable

Start by auditing the repository and reading the relevant shared tool instructions.

Then implement the smallest practical workflow foundation that can support one verified or explicitly draft example of each of the following:

* A work/project record.
* A philosophical principle or writing.
* A dated event/document record.

Keep existing website behavior intact.

Establish JSON validation and repeatable generation.

Add a GitHub Actions workflow to validate and build, with public deployment appropriately gated until authorized.

Document the actual build commands, configuration requirements, test results, decisions, and outstanding blockers.

Do not fabricate example biographical facts or publish unfinished editorial material.

Commit the handoff, implementation documentation, and safe changes to the repository.

At completion, report what changed, what actually works, the relevant commit or pull request links, and the minimum decisions still required from me.

Remember: We're establishing the machinery first. We will develop the comprehensive sitemap, content map, and editorial material separately.
