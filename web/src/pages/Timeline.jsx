import { useEffect, useMemo, useState } from 'react';
import { Page } from '../components/Layout.jsx';
import { DocLink, useHref, Video } from '../components/ui.jsx';

function Entry({ e, open }) {
  const href = useHref();
  return (
    <details id={e.id} className="tl-entry" open={open || undefined}>
      <summary className="tl-entry__summary">
        <span className="tl-entry__type">{e.type || 'Entry'}</span>
        <span className="tl-entry__head">
          <strong className="tl-entry__title">{e.title}</strong>
          {e.subTitle && <span className="tl-entry__sub">{e.subTitle}</span>}
        </span>
        <span className="tl-entry__toggle" aria-hidden="true"></span>
      </summary>
      <div className="tl-entry__body">
        {e.description && <div className="prose" dangerouslySetInnerHTML={{ __html: e.description }}></div>}
        {e.media.some((m) => m.kind === 'video') && (
          <div className="tl-videos">{e.media.filter((m) => m.kind === 'video').map((m) => <Video key={m.youtube} id={m.youtube} title={e.title} />)}</div>
        )}
        {e.media.some((m) => m.kind === 'image') && (
          <div className="tl-thumbs">
            {e.media.filter((m) => m.kind === 'image').map((m) => (
              <a key={m.src} href={href(m.src)} className="tl-thumb"><img src={href(m.src)} alt={`${e.title}: ${m.src.split('/').pop()}`} loading="lazy" /></a>
            ))}
          </div>
        )}
        {e.media.some((m) => m.kind === 'doc') && (
          <div className="evidence-list">{e.media.filter((m) => m.kind === 'doc').map((m) => <DocLink key={m.src} {...m} />)}</div>
        )}
        {e.postscript && <p className="postscript">P.S. <span dangerouslySetInnerHTML={{ __html: e.postscript }}></span></p>}
        <a href={`#${e.id}`} className="permalink mono">#{e.id} · permanent link</a>
      </div>
    </details>
  );
}

const norm = (s) => (s || '').toLowerCase().replace(/<[^>]+>/g, ' ');

export default function Timeline(props) {
  const { years, entryCount } = props;
  const [q, setQ] = useState('');
  const [hash, setHash] = useState('');
  const max = Math.max(...years.map((y) => y.entries.length));

  // Open whatever entry the link points at, now and when the hash changes.
  useEffect(() => {
    const go = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      setHash(h);
      const el = h && document.getElementById(h);
      if (el?.tagName === 'DETAILS') el.open = true;
      if (el) el.scrollIntoView();
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);

  const filtered = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return years;
    return years
      .map((y) => ({ ...y, entries: y.entries.filter((e) => {
        const text = norm(`${e.title} ${e.subTitle} ${e.description} ${y.label}`);
        return terms.every((t) => text.includes(t));
      }) }))
      .filter((y) => y.entries.length);
  }, [q, years]);
  const shown = filtered.reduce((n, y) => n + y.entries.length, 0);

  return (
    <Page props={props} current="timeline">
      <section className="band band--tight">
        <div className="wrap page-head">
          <div className="stack">
            <h1 className="display">The Archive</h1>
            <p className="lede">Year by year, from the start to today, plus the Visionary Projects still waiting to be built. Every entry has a permanent link.</p>
          </div>
          <p className="stat"><strong>{entryCount}</strong>entries · {years.length} sections</p>
        </div>
      </section>

      <nav aria-label="Jump to year" className="wrap">
        <div className="year-bars">
          {years.map((y) => (
            <a key={y.id} href={`#${y.id}`} className={`year-bar${hash === y.id ? ' is-current' : ''}`} title={`${y.label} · ${y.entries.length} ${y.entries.length === 1 ? 'entry' : 'entries'}`}>
              <span className="year-bar__bar" style={{ height: `${Math.max(8, (y.entries.length / max) * 100)}%` }}></span>
              <span className="year-bar__label">{/^\d{4}$/.test(y.label) ? `'${y.label.slice(2)}` : 'VIS'}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="wrap">
        <div className="filters" role="search">
          <label className="search">
            <span className="kicker muted">Search</span>
            <input type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="BlackFacts, Roxbury, MIT…" />
          </label>
          <span className="muted mono filters__note" aria-live="polite">{q ? `${shown} of ${entryCount} entries` : `${entryCount} entries`}</span>
        </div>
      </div>

      {filtered.map((y) => (
        <section key={y.id} id={y.id} className="band band--year">
          <div className="wrap tl-year">
            <div className="tl-year__head">
              <h2 className={`tl-year__label${y.id === years[0].id ? '' : ''}`}>{y.label}</h2>
              <span className="mono">{y.entries.length} {y.entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <div className="tl-year__entries">
              {y.entries.map((e) => <Entry key={e.id} e={e} open={!!q || hash === e.id} />)}
            </div>
          </div>
        </section>
      ))}
      {!filtered.length && <div className="wrap band"><p className="lede">Nothing matches “{q}”.</p></div>}
    </Page>
  );
}
