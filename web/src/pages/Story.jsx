import { Page } from '../components/Layout.jsx';
import { Draft, Link, Needs, PullQuote } from '../components/ui.jsx';

// Ken's own words, unchanged; the page only adds chapter headings and links to the evidence.
export default function Story(props) {
  const { story: s } = props;
  return (
    <Page props={props} current="story">
      <section className="band band--tight band--rule">
        <div className="wrap stack">
          <p className="kicker red">My Story <Draft publish={s.publish} /></p>
          <h1 className="display">Bed-Stuy → MIT → Boston → <span className="red">Home</span></h1>
          <p className="lede">{s.dek}</p>
          <p className="note">{s.source}</p>
        </div>
      </section>

      <section className="band band--ink">
        <div className="wrap">
          <ol className="lineage journey">
            {s.journey.map((j, i) => (
              <li key={j.place} className={i === s.journey.length - 1 ? 'is-now' : ''}>
                <span className="mono">{j.when}</span>
                <span className="lineage__title">{j.place}</span>
                <span className="lineage__text">{j.text}</span>
                {j.links.map((l) => <Link key={l.title} to={l.path} className="journey__link mono">{l.title} →</Link>)}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band">
        <div className="wrap stack-lg">
          <Needs items={s.needs} />
          {s.chapters.map((c, i) => (
            <article key={c.heading} className="chapter">
              <header className="chapter__head">
                <span className="mono red">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="h2">{c.heading}</h2>
                {c.evidence.length > 0 && (
                  <ul className="chapter__evidence">
                    {c.evidence.map((e) => (
                      <li key={e.title}><Link to={e.path} className="practice-link"><span className="mono muted">{e.kind}{e.year ? ` · ${e.year}` : ''}</span><strong>{e.title}</strong></Link></li>
                    ))}
                  </ul>
                )}
              </header>
              <div className="chapter__body essay">
                {c.placeholder && <div className="placeholder chapter__slot">{c.placeholder}</div>}
                {(c.paragraphs || []).map((p, k) => <p key={k} className={i === 0 && k === 0 ? 'chapter__greeting' : undefined}>{p}</p>)}
                {c.quote && <PullQuote text={c.quote} cite="My commitment, 1992" />}
                {c.signoff && <p className="chapter__signoff">{c.signoff}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="band band--flush">
        <div className="wrap doors">
          <Link to="work/" className="door door--dark">
            <span className="door__label">Next · My Work</span>
            <span className="door__title">The <span className="red">receipts</span></span>
            <span className="door__text">Every project, with its dates, status and evidence.</span>
            <span className="door__cta">See the work →</span>
          </Link>
          <Link to="philosophy/" className="door">
            <span className="door__label">Then · My Philosophy</span>
            <span className="door__title">Why I do it</span>
            <span className="door__text">Duty and Opportunity, and the principles behind the work.</span>
            <span className="door__cta">Read the essays →</span>
          </Link>
        </div>
      </section>
    </Page>
  );
}
