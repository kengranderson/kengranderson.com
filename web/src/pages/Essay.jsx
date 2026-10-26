import { Page } from '../components/Layout.jsx';
import { Draft, Link, PullQuote, useHref } from '../components/ui.jsx';

export default function Essay(props) {
  const { essay: e, principles, practice, event, next } = props;
  const href = useHref();
  return (
    <Page props={props} current="philosophy">
      <section className="band band--rule">
        <div className="wrap stack">
          <p className="kicker"><Link to="philosophy/" className="muted">Philosophy</Link> <span className="red">/</span> Principle {String(e.order).padStart(2, '0')} <Draft publish={e.publish} /></p>
          <h1 className="display display--xl">{e.title}</h1>
          <p className="lede">{e.dek}</p>
          <p className="meta-line mono">
            <span>{e.dateLabel}</span>{e.place && <span>{e.place}</span>}<span>{e.readingTime}</span>
            {e.source && <a href={href(e.source)} className="strong">Original PDF ↓</a>}
          </p>
        </div>
      </section>

      <section className="band">
        <div className="wrap essay-layout">
          <nav aria-label="Principles" className="principles">
            <span className="kicker muted">Principles</span>
            {principles.map((p) => (
              <Link key={p.slug} to={p.path} className={`principles__link${p.current ? ' is-current' : ''}`} aria-current={p.current ? 'page' : undefined}>{p.title}</Link>
            ))}
          </nav>

          <article className="essay">
            {e.excerpt && <p className="note">{e.excerpt}</p>}
            {e.paragraphs.map((para, i) => {
              if (typeof para === 'string') return <p key={i} className={i === 0 ? 'dropcap' : undefined}>{para}</p>;
              if (para.pullQuote) return <PullQuote key={i} text={para.pullQuote} accent={para.accent} />;
              return <p key={i}><strong>{para.strong}</strong></p>;
            })}
            <p className="essay__foot mono"><span>{e.copyright}</span><a href={`#main`}>Back to top</a></p>
          </article>

          <aside className="essay-aside">
            {practice.length > 0 && (
              <div className="stack-sm">
                <h2 className="kicker red">The principle in practice</h2>
                {practice.map((w) => (
                  <Link key={w.slug} to={w.path} className="practice-link">
                    <span className="mono muted">{w.start ?? 'Now'} · {w.status ?? ''}</span>
                    <strong>{w.title}</strong>
                  </Link>
                ))}
              </div>
            )}
            {event && (
              <div className="plaque">
                <span className="mono">Where I said this · {event.year}</span>
                <span className="plaque__title">{event.title}</span>
                <Link to={event.path} className="mono">In the archive →</Link>
              </div>
            )}
            <div className="book-note">
              <span className="kicker">Coming: the book</span>
              <span><em>Unapologetically Black Technology</em>. This site is the prelude.</span>
            </div>
          </aside>
        </div>
      </section>

      {next && (
        <section className="band band--flush">
          <div className="wrap">
            <Link to={next.path} className="next-band">
              <span className="mono">Next principle →</span>
              <span className="display display--md">{next.title}</span>
              {next.path == null && <span className="mono">Coming</span>}
            </Link>
          </div>
        </section>
      )}
    </Page>
  );
}
