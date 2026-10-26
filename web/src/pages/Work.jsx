import { useState } from 'react';
import { Page } from '../components/Layout.jsx';
import { Chip, Link, ProjectCard, useHref } from '../components/ui.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'maintained', label: 'Maintained' },
  { key: 'archived', label: 'Archived' }
];

export default function Work(props) {
  const { now, earlier, lineage } = props;
  const [filter, setFilter] = useState('all');
  const href = useHref();
  const show = (p) => filter === 'all' || p.status === filter;
  const nowShown = now.filter(show);
  const earlierShown = earlier.filter(show);
  return (
    <Page props={props} current="work">
      <section className="band band--tight">
        <div className="wrap page-head">
          <div className="stack">
            <h1 className="display">My Work</h1>
            <p className="lede">Current work first. Every project shows what it is, who it served, its status and the evidence. Draw your own conclusions.</p>
          </div>
          <p className="stat"><strong>30+</strong>years building · 1992 → today</p>
        </div>
      </section>

      <div className="wrap">
        <div role="group" aria-label="Filter projects by status" className="filters">
          <span className="kicker muted">Status</span>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="filter" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
          <span className="muted mono filters__note">Newest first</span>
        </div>
      </div>

      {nowShown.length > 0 && (
        <section className="band">
          <div className="wrap stack">
            <h2 className="kicker red">Now</h2>
            <div className="card-grid">
              {nowShown.map((p) => <ProjectCard key={p.slug} p={p} big={p.flagship} />)}
            </div>
          </div>
        </section>
      )}

      {filter === 'all' && lineage.length > 1 && (
        <section className="band band--ink">
          <div className="wrap stack">
            <div className="title-row title-row--split">
              <h2 className="h1">Lineage: one idea, <span className="red">30 years</span></h2>
              <span className="mono">Put the neighborhood online. Keep it ours.</span>
            </div>
            <ol className="lineage">
              {lineage.map((l, i) => (
                <li key={l.slug} className={i === lineage.length - 1 ? 'is-now' : ''}>
                  <span className="mono">{i === lineage.length - 1 ? 'Today' : l.start ?? '[YEAR]'}</span>
                  <Link to={l.path} className="lineage__title">{l.title}</Link>
                  <span className="lineage__text">{l.summary}</span>
                  <Chip status={l.status} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {earlierShown.length > 0 && (
        <section className="band">
          <div className="wrap stack">
            <div className="title-row title-row--split section-rule">
              <h2 className="h2">Earlier work</h2>
              <Link to="timeline/" className="text-cta">Everything, by year →</Link>
            </div>
            <ul className="rows">
              {earlierShown.map((p) => (
                <li key={p.slug}>
                  <Link to={p.path} className="row">
                    <span className="row__year">{p.start ?? '—'}</span>
                    {p.image ? <img className="row__thumb" src={href(p.image)} alt="" loading="lazy" style={p.imageFit === 'contain' ? { objectFit: 'contain' } : undefined} /> : <span className="row__thumb row__thumb--empty"></span>}
                    <span className="row__main"><strong className="row__title">{p.title}</strong><span className="row__text">{p.summary}</span></span>
                    <Chip status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </Page>
  );
}

