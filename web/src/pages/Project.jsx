import { Page } from '../components/Layout.jsx';
import { Chip, DocLink, Draft, Exhibit, Link, Needs, useRelHtml, Verify, Video } from '../components/ui.jsx';

// A project page is its work record plus the timeline entries it points to;
// the entries supply the evidence (video, screenshots, clippings, documents).
export default function Project(props) {
  const { project: p, entries, lineage, principles, prev, next } = props;
  const relHtml = useRelHtml();
  const media = entries.flatMap((e) => e.media.map((m) => ({ ...m, entry: e })));
  const videos = media.filter((m) => m.kind === 'video');
  const images = media.filter((m) => m.kind === 'image');
  const docs = media.filter((m) => m.kind === 'doc');
  const here = lineage.findIndex((l) => l.slug === p.slug);
  let n = 0;
  const exhibitNo = () => `Exhibit ${++n}.`;

  return (
    <Page props={props} current="work">
      <section className="band band--rule band--tight">
        <div className="wrap stack">
          <nav aria-label="Breadcrumb" className="crumbs"><Link to="work/">Work</Link> / <span>{p.title}</span></nav>
          <div className="meta-row">
            <Chip status={p.status} /><Draft publish={p.publish} />
            <span className="mono strong">{p.start ?? '[YEAR]'}{p.end ? `–${p.end}` : ''}</span>
            {p.place && <span className="mono muted">{p.place}</span>}
          </div>
          <h1 className="display display--xl">{p.title}</h1>
          <p className="lede lede--xl">{p.summary}</p>
          {p.verify.map((v) => <p key={v}><Verify>{`Verify · ${v}`}</Verify></p>)}
        </div>
      </section>

      <section className="band">
        <div className="wrap with-aside">
          <div className="with-aside__main stack-lg">
            <Needs items={p.needs} />
            {p.image && <Exhibit src={p.image} alt={p.imageAlt} fit={p.imageFit} caption={<span><strong>{exhibitNo()}</strong> {p.title} · {p.start ?? ''}</span>} />}

            {p.features.length > 0 && (
              <div className="stack">
                <h2 className="h2">What it was</h2>
                <ul className="features">{p.features.map((f) => <li key={f.title}><strong>{f.title}</strong><span>{f.text}</span></li>)}</ul>
              </div>
            )}

            {videos.map((v) => (
              <Video key={v.youtube} id={v.youtube} title={`${v.entry.title} video`} large caption={<><span><strong>{exhibitNo()}</strong> {v.entry.title} · {v.entry.year}</span><span className="muted">youtube:{v.youtube}</span></>} />
            ))}

            {entries.map((e) => (e.description || e.postscript) && (
              <article key={e.id} className="stack">
                <h2 className="h2">{e.title} <span className="mono muted">{e.year}</span></h2>
                {e.subTitle && <p className="body-lg em">{e.subTitle}</p>}
                {e.description && <div className="prose" dangerouslySetInnerHTML={{ __html: relHtml(e.description) }}></div>}
                {e.postscript && <p className="postscript">P.S. {e.postscript}</p>}
                <Link to={e.path} className="text-cta">In the archive: #{e.id} →</Link>
              </article>
            ))}

            {images.length > 1 && (
              <div className="stack">
                <h2 className="h2">The exhibits</h2>
                <div className="gallery">
                  {images.filter((m) => m.src !== p.image).map((m) => <Exhibit key={m.src} src={m.src} alt={`${m.entry.title}: ${m.src.split('/').pop()}`} caption={<span>{m.entry.year} · {m.src.split('/').pop()}</span>} />)}
                </div>
              </div>
            )}

            {docs.length > 0 && (
              <div className="stack">
                <h2 className="h2">Documents</h2>
                <div className="evidence-list">{docs.map((d) => <DocLink key={d.src} {...d} />)}</div>
              </div>
            )}
          </div>

          <aside className="with-aside__side stack-lg">
            <div className="factsheet">
              <div className="factsheet__head">Fact sheet</div>
              <dl className="facts">
                <div><dt>Served</dt><dd>{p.served ?? '[Who it served]'}</dd></div>
                <div><dt>Years</dt><dd className="mono">{p.start ?? '[YEAR]'} → {p.end ?? (p.status === 'live' || p.status === 'maintained' ? 'today' : '[END]')}</dd></div>
                <div><dt>My role</dt><dd>{p.role ?? '[Role]'}</dd></div>
                <div><dt>Evidence</dt><dd className="mono">{[videos.length && `${videos.length} video`, images.length && `${images.length} images`, docs.length && `${docs.length} documents`].filter(Boolean).join(' · ') || 'To be added'}</dd></div>
                {p.url && <div><dt>Visit</dt><dd><a href={p.url}>{p.url.replace(/^https?:\/\//, '')} ↗</a></dd></div>}
              </dl>
            </div>

            {lineage.length > 1 && (
              <div className="stack-sm">
                <h2 className="kicker red">Lineage</h2>
                {lineage.map((l, i) => (
                  i === here
                    ? <div key={l.slug} className="lineage-card is-here"><span className="mono">You are here · {l.start ?? '[YEAR]'}</span><strong>{l.title}</strong></div>
                    : <Link key={l.slug} to={l.path} className="lineage-card"><span className="mono muted">{i < here ? '← Came from' : 'Led to →'} · {l.start ?? 'today'}</span><strong>{l.title}</strong></Link>
                ))}
              </div>
            )}

            {principles.length > 0 && (
              <div className="stack-sm">
                <h2 className="kicker red">Principles behind it</h2>
                {principles.map((pr) => <Link key={pr.title} to={pr.path} className="list-link"><span>{pr.title}</span><span className="red">→</span></Link>)}
              </div>
            )}

            {entries.length > 0 && (
              <div className="stack-sm">
                <h2 className="kicker red">In the archive</h2>
                {entries.map((e) => <Link key={e.id} to={e.path} className="list-link"><span><span className="mono strong">{e.year}</span> {e.title}</span><span className="red">→</span></Link>)}
              </div>
            )}
          </aside>
        </div>
      </section>

      {(prev || next) && (
        <section className="band band--flush">
          <div className="wrap"><div className="pager">
            {prev ? <Link to={prev.path} className="pager__item"><span className="mono muted">← Previous · {prev.start ?? ''}</span><span className="h3">{prev.title}</span></Link> : <span></span>}
            {next ? <Link to={next.path} className="pager__item pager__item--next"><span className="mono muted">Next · {next.start ?? ''} →</span><span className="h3">{next.title}</span></Link> : <span></span>}
          </div></div>
        </section>
      )}
    </Page>
  );
}
