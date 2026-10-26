// Build-time only: reads the JSON content and turns it into the props each page renders.
// Nothing here ships to the browser; each page gets just its own props, embedded in its HTML.
import fs from 'node:fs';
import path from 'node:path';
import highlightsRaw from '../../KenGranderson/highlights.json';
import site from '../../KenGranderson/content/site.json';
import principlesFile from '../../KenGranderson/content/philosophy/_principles.json';
import story from '../../KenGranderson/content/story.json';

const workFiles = import.meta.glob('../../KenGranderson/content/work/*.json', { eager: true, import: 'default' });
const essayFiles = import.meta.glob(['../../KenGranderson/content/philosophy/*.json', '!../../KenGranderson/content/philosophy/_*.json'], { eager: true, import: 'default' });

// preview shows draft and review records plus VERIFY / needs notes; production shows only published.
export const MODE = process.env.SITE_MODE === 'production' ? 'production' : 'preview';
const visible = (rec) => MODE === 'preview' || rec.publish === 'published';

function yearId(key) {
  return /^\d{4}$/.test(key) ? key : key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// The build runs from web/ (npm run build), so the legacy site folder is one level up.
const SITE_DIR = path.resolve(process.cwd(), '../KenGranderson');
const exists = (src) => /^https?:/.test(src) || fs.existsSync(path.join(SITE_DIR, src));

function mediaItem(src) {
  const ext = (/\.(\w+)$/.exec(src) || [])[1]?.toLowerCase() || null;
  if (!ext) return { kind: 'video', youtube: src };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { kind: 'image', src };
  return { kind: 'doc', src, ext, name: decodeURIComponent(src.split('/').pop()) };
}

// highlights.json keeps its shape; ids reuse each entry's hash so old links (#blackfacts97) still land.
const seen = new Set();
export const timeline = Object.entries(highlightsRaw).map(([key, items]) => ({
  key,
  id: yearId(key),
  label: key,
  entries: items.map((item) => {
    let id = item.hash;
    if (seen.has(id)) id = `${item.hash}-${key}`;
    seen.add(id);
    return {
      id,
      ref: `${key}/${item.hash}`,
      year: key,
      type: item.type || null,
      title: item.title,
      subTitle: item.subTitle || null,
      description: item.description || null,
      postscript: item.postscript || null,
      media: (item.mediaUrls || []).map(mediaItem).filter((m) => {
        if (m.kind === 'video' || exists(m.src)) return true;
        console.warn(`WARN highlights.json ${key}/${item.hash} names missing file ${m.src}: left out`);
        return false;
      })
    };
  })
}));

const entryByRef = new Map(timeline.flatMap((y) => y.entries.map((e) => [e.ref, e])));
export const entryCount = timeline.reduce((n, y) => n + y.entries.length, 0);

const allWork = Object.values(workFiles);
const workBySlug = new Map(allWork.map((w) => [w.slug, w]));
export const work = allWork
  .filter(visible)
  .sort((a, b) => (b.flagship ? 1 : 0) - (a.flagship ? 1 : 0) || (b.years?.start ?? 9999) - (a.years?.start ?? 9999));

const essays = Object.values(essayFiles).filter(visible).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const essayBySlug = new Map(essays.map((e) => [e.slug, e]));

const workPath = (slug) => (workBySlug.has(slug) && visible(workBySlug.get(slug)) ? `work/${slug}/` : null);
const essayPath = (slug) => (essayBySlug.has(slug) ? `philosophy/${slug}/` : null);
const timelinePath = (entry) => `timeline/#${entry.id}`;

function workSummary(w) {
  return {
    slug: w.slug,
    title: w.title,
    status: w.status ?? null,
    publish: w.publish,
    start: w.years?.start ?? null,
    end: w.years?.end ?? null,
    summary: w.cardSummary || w.summary,
    served: w.served || null,
    image: w.image || null,
    imageAlt: w.imageAlt || '',
    imageFit: w.imageFit || 'cover',
    flagship: !!w.flagship,
    path: workPath(w.slug)
  };
}

function lineageLink(slug, label) {
  const w = workBySlug.get(slug);
  if (!w) return null;
  return { label, title: w.lineageTitle || w.title, start: w.years?.start ?? null, path: workPath(slug) };
}

// Follow "from" links back to the oldest ancestor, so every page can show the whole chain.
function lineageChain(slug) {
  const chain = [];
  const guard = new Set();
  let cur = workBySlug.get(slug);
  while (cur?.lineage?.from && !guard.has(cur.slug)) {
    guard.add(cur.slug);
    cur = workBySlug.get(cur.lineage.from);
  }
  guard.clear();
  while (cur && !guard.has(cur.slug)) {
    guard.add(cur.slug);
    if (visible(cur)) chain.push({ ...workSummary(cur), title: cur.lineageTitle || cur.title });
    const next = allWork.find((w) => w.lineage?.from === cur.slug);
    cur = cur.lineage?.to ? workBySlug.get(cur.lineage.to) : next;
  }
  return chain;
}

function principleLinks(slugs = []) {
  return slugs
    .map((s) => principlesFile.principles.find((p) => p.slug === s))
    .filter(Boolean)
    .map((p) => ({ title: p.title, path: essayPath(p.slug) }));
}

function nav(pages) {
  return site.nav.map((n) => ({ ...n, path: pages.has(n.page) ? pagePath(n.page) : null }));
}

function pagePath(page) {
  return { home: '', story: 'story/', work: 'work/', timeline: 'timeline/', philosophy: 'philosophy/', connect: 'connect/' }[page] ?? null;
}

function common(pages) {
  return {
    mode: MODE,
    name: site.name,
    nav: nav(pages),
    motto: site.motto,
    links: site.links.filter((l) => l.url || MODE === 'preview')
  };
}

// "work:<slug>" or "timeline:<hash>" → a labelled link (unknown or hidden refs drop out).
const entryByHash = new Map(timeline.flatMap((y) => y.entries.map((e) => [e.id, e])));
function evidenceLinks(refs = []) {
  return refs.map((ref) => {
    const [kind, key] = ref.split(':');
    if (kind === 'work') {
      const w = workBySlug.get(key);
      return w && visible(w) ? { kind: 'Project', title: w.title, year: w.years?.start ?? null, path: workPath(key) } : null;
    }
    const e = entryByHash.get(key);
    return e ? { kind: 'Archive', title: e.title, year: e.year, path: timelinePath(e) } : null;
  }).filter(Boolean);
}

// Every page the build writes, with the props it renders from.
export function routes() {
  const pages = new Set(['home', 'work', 'timeline', 'connect']);
  if (visible(story)) pages.add('story');
  if (essays.length) pages.add('philosophy');
  const base = common(pages);
  const list = [];

  const flagship = work.find((w) => w.flagship);
  const proof = work
    .filter((w) => w.proof && w.years?.start)
    .sort((a, b) => a.years.start - b.years.start)
    .map((w) => ({ year: w.years.start, title: w.proofTitle || w.title, text: w.proof, path: workPath(w.slug) }));

  list.push({
    path: '',
    page: 'Home',
    title: `${site.name}: ${site.hero.lead} ${site.hero.accent}`,
    description: `${site.hero.lead} ${site.hero.accent} ${site.hero.intro}`,
    props: {
      ...base,
      tagline: site.tagline,
      hero: site.hero,
      flagship: flagship && {
        ...workSummary(flagship),
        summary: flagship.summary,
        place: flagship.place || null,
        platform: flagship.platform || null,
        url: flagship.url || null,
        lineage: lineageChain(flagship.slug).filter((l) => l.slug !== flagship.slug)
      },
      doors: site.doors.map((d) => ({ ...d, path: pages.has(d.page) ? pagePath(d.page) : null })),
      proof,
      entryCount,
      video: site.video,
      connect: { title: site.connect.title, text: site.connect.text }
    }
  });

  list.push({
    path: 'work/',
    page: 'Work',
    title: `My Work | ${site.name}`,
    description: 'Current work first. Every project shows what it is, who it served, its status and the evidence.',
    props: {
      ...base,
      now: work.filter((w) => w.status === 'live' || w.status === 'maintained').map(workSummary),
      earlier: work.filter((w) => !(w.status === 'live' || w.status === 'maintained')).map(workSummary),
      lineage: lineageChain('my-bed-stuy')
    }
  });

  for (const w of work) {
    const entries = (w.highlights || []).map((r) => entryByRef.get(r)).filter(Boolean);
    const idx = work.findIndex((x) => x.slug === w.slug);
    const neighbor = (x) => x && { title: x.title, start: x.years?.start ?? null, path: workPath(x.slug) };
    list.push({
      path: `work/${w.slug}/`,
      page: 'Project',
      title: `${w.title} | ${site.name}`,
      description: w.summary,
      props: {
        ...base,
        project: {
          ...workSummary(w),
          summary: w.summary,
          place: w.place || null,
          role: w.role ?? null,
          url: w.url || null,
          features: w.features || [],
          needs: MODE === 'preview' ? w.needs || [] : [],
          verify: MODE === 'preview' ? w.verify || [] : []
        },
        entries: entries.map((e) => ({ ...e, path: timelinePath(e) })),
        lineage: lineageChain(w.slug),
        principles: principleLinks(w.principles),
        prev: neighbor(work[idx + 1]),
        next: neighbor(work[idx - 1])
      }
    });
  }

  list.push({
    path: 'timeline/',
    page: 'Timeline',
    title: `The Archive | ${site.name}`,
    description: `Year by year: ${entryCount} entries of technology by, for and about Black communities.`,
    props: { ...base, years: timeline, entryCount }
  });

  if (essays.length) {
    list.push({
      path: 'philosophy/',
      page: 'Philosophy',
      title: `My Philosophy | ${site.name}`,
      description: 'Essays and principles: Duty and Opportunity, ownership, technological self-determination.',
      props: { ...base, principles: principlesFile.principles.map((p) => ({ ...p, path: essayPath(p.slug), dek: essayBySlug.get(p.slug)?.dek || null })) }
    });
    essays.forEach((e, i) => {
      const event = e.event && entryByRef.get(e.event);
      const nextP = principlesFile.principles[principlesFile.principles.findIndex((p) => p.slug === e.slug) + 1];
      list.push({
        path: `philosophy/${e.slug}/`,
        page: 'Essay',
        title: `${e.title} | ${site.name}`,
        description: e.dek,
        props: {
          ...base,
          essay: { ...e, practice: undefined, event: undefined },
          principles: principlesFile.principles.map((p) => ({ ...p, path: essayPath(p.slug), current: p.slug === e.slug })),
          practice: (e.practice || []).map((s) => workBySlug.get(s)).filter((w) => w && visible(w)).map(workSummary),
          event: event ? { year: event.year, title: event.title, path: timelinePath(event) } : null,
          next: nextP ? { title: nextP.title, path: essayPath(nextP.slug) } : null
        }
      });
    });
  }

  if (pages.has('story')) {
    list.push({
      path: 'story/',
      page: 'Story',
      title: `My Story | ${site.name}`,
      description: story.dek,
      props: {
        ...base,
        story: {
          ...story,
          needs: MODE === 'preview' ? story.needs || [] : [],
          journey: story.journey.map((j) => ({ ...j, links: evidenceLinks(j.links) })),
          chapters: story.chapters.map((c) => ({ ...c, evidence: evidenceLinks(c.evidence) }))
        }
      }
    });
  }

  list.push({
    path: 'connect/',
    page: 'Connect',
    title: `Connect | ${site.name}`,
    description: site.connect.text,
    props: { ...base, connect: site.connect, portrait: 'images/face-cropped-square.jpg' }
  });

  return list;
}
