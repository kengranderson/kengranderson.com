import { Page } from '../components/Layout.jsx';
import { useHref, useSite } from '../components/ui.jsx';

export default function Connect(props) {
  const { connect: c, links, portrait } = props;
  const { mode } = useSite();
  const href = useHref();
  const mailto = (subject) => (c.email ? `mailto:${c.email}?subject=${encodeURIComponent(subject)}` : null);
  return (
    <Page props={props} current="connect">
      <section className="band">
        <div className="wrap with-aside">
          <div className="with-aside__main stack-lg">
            <div className="stack">
              <h1 className="display display--xl">Let's <span className="red">build.</span></h1>
              <p className="lede">I'm not building followers. I'm building things WE own. If you want to build, teach, fund, report or partner, pick the door that fits and write me directly.</p>
            </div>
            <div className="intents">
              {c.intents.map((it, i) => {
                const to = mailto(it.subject);
                const Tag = to ? 'a' : 'div';
                return (
                  <Tag key={it.subject} href={to || undefined} className={`intent${it.dark ? ' intent--dark' : ''}`}>
                    <span className="mono red">{String(i + 1).padStart(2, '0')}</span>
                    <span className="intent__title">{it.title}</span>
                    <span className="intent__text">{it.text}</span>
                    <span className="intent__cta mono">Email · subject: {it.subject} →</span>
                  </Tag>
                );
              })}
            </div>
            {(c.email || mode === 'preview') && (
              <p className="just-write"><span className="kicker muted">Or just write</span> {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <strong className="mono">[EMAIL ADDRESS]</strong>}</p>
            )}
          </div>
          <aside className="with-aside__side stack-lg">
            <figure className="exhibit">
              <img src={href(portrait)} alt="Ken Granderson" className="portrait" loading="lazy" />
              <figcaption className="caption">Ken Granderson · Bed-Stuy, Brooklyn</figcaption>
            </figure>
            <nav aria-label="Elsewhere" className="elsewhere">
              {links.map((l) => (
                l.url
                  ? <a key={l.label} href={l.url}><span><strong>{l.label}</strong><small>{l.note}</small></span><span className="red">↗</span></a>
                  : <span key={l.label} className="is-pending"><span><strong>{l.label}</strong><small>[URL needed]</small></span></span>
              ))}
            </nav>
          </aside>
        </div>
      </section>
    </Page>
  );
}
