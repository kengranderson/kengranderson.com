import { useEffect } from 'react';
import { Page } from '../components/Layout.jsx';
import { Chip, Draft, Link, Video, useHref } from '../components/ui.jsx';

// The old one-page site linked straight to timeline anchors (/#1997, /#blackfacts97).
// Send those visitors to the same anchor on the new timeline page.
function useLegacyHashRedirect() {
  const href = useHref();
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash || hash === 'main') return;
    const id = /^\d{4}$/.test(hash) ? hash : hash.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    location.replace(`${href('timeline/')}#${/^\d{4}$/.test(hash) || /\s/.test(hash) ? id : hash}`);
  }, []);
}

function AssetMap({ to, label }) {
  return (
    <Link to={to} className="asset-map" aria-label={label}>
      <span className="pin" style={{ left: '18%', top: '22%' }}></span>
      <span className="pin" style={{ left: '41%', top: '38%' }}></span>
      <span className="pin pin--sq" style={{ left: '63%', top: '18%' }}></span>
      <span className="pin pin--sq" style={{ left: '30%', top: '64%' }}></span>
      <span className="pin" style={{ left: '72%', top: '58%' }}></span>
      <span className="asset-map__note">PLACEHOLDER: live screenshot of the community asset map</span>
    </Link>
  );
}

export default function Home(props) {
  useLegacyHashRedirect();
  const { tagline, hero, flagship: f, doors, proof, entryCount, video, connect } = props;
  return (
    <Page props={props} current="home">
      <section className="band band--rule">
        <div className="wrap hero">
          <div className="hero__text">
            <p className="kicker kicker--plain">{tagline.map((t, i) => <span key={t}>{i > 0 && <span className="red"> / </span>}{t}</span>)}</p>
            <h1 className="display">{hero.lead} <span className="red">{hero.accent}</span></h1>
            <p className="lede">{hero.intro}</p>
            <div className="btn-row">
              <Link to="work/" className="btn">See the work</Link>
              <Link to="timeline/" className="btn btn--outline">Browse the archive</Link>
            </div>
          </div>
          <div className="signage">
            <span className="kicker">Signage slot</span>
            <span className="signage__text">Unapologetically Black Technology</span>
            <span className="signage__note">Replace with Ken's red / white / black sign</span>
          </div>
        </div>
      </section>

      {f && (
        <section className="band band--stone band--rule">
          <div className="wrap stack">
            <div className="title-row">
              <span className="kicker red">Now</span>
              <h2 className="h1">{f.title}</h2>
              <Chip status={f.status} /><Draft publish={f.publish} />
            </div>
            <div className="flagship">
              <AssetMap to={f.url} label={`Open the ${f.title} community asset map`} />
              <div className="flagship__body">
                <p className="lede">{f.summary}</p>
                <dl className="facts">
                  {f.place && <div><dt>Serves</dt><dd>{f.place}</dd></div>}
                  {f.platform && <div><dt>Platform</dt><dd>{f.platform}</dd></div>}
                  <div><dt>Since</dt><dd>{f.start ?? '[YEAR]'}</dd></div>
                </dl>
                {f.lineage.length > 0 && (
                  <div className="stack-sm">
                    <span className="kicker muted">Lineage</span>
                    <p className="lineage-inline">
                      {f.lineage.map((l) => <span key={l.slug}><Link to={l.path}>{l.start ? `${l.start} ` : ''}{l.title}</Link><span className="red"> → </span></span>)}
                      <strong>Today</strong>
                    </p>
                  </div>
                )}
                <div className="btn-row push-down">
                  {f.url && <a href={f.url} className="btn btn--red">Open the map ↗</a>}
                  <Link to={f.path} className="btn btn--outline">How it's built</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="band band--rule">
        <div className="wrap doors">
          {doors.map((d, i) => (
            <Link key={d.page} to={d.path} className={`door${d.dark ? ' door--dark' : ''}`}>
              <span className="door__label">{String(i + 1).padStart(2, '0')} · {d.label}</span>
              <span className="door__title">{d.accentWord ? d.title.split(d.accentWord).flatMap((part, j) => (j ? [<span key={j} className="red">{d.accentWord}</span>, part] : [part])) : d.title}</span>
              <span className="door__text">{d.text}</span>
              <span className="door__cta">{d.path != null ? `${d.cta} →` : 'Coming soon'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="band band--rule">
        <div className="wrap stack">
          <div className="title-row title-row--split">
            <h2 className="display display--md">Since <span className="red">1992</span></h2>
            <Link to="timeline/" className="text-cta">All {entryCount} entries in the archive →</Link>
          </div>
          <ol className="proof">
            {proof.map((p) => (
              <li key={p.title}><Link to={p.path}><span className="proof__year">{p.year}</span><span className="proof__title">{p.title}</span><span className="proof__text">{p.text}</span></Link></li>
            ))}
            {f && <li className="proof--now"><Link to={f.path}><span className="proof__year">Today</span><span className="proof__title">{f.title}</span><span className="proof__text">Back home since 2018</span></Link></li>}
          </ol>
        </div>
      </section>

      <section className="band band--rule">
        <div className="wrap split">
          <div className="split__side stack">
            <span className="kicker red">{video.kicker}</span>
            <h2 className="h1">{video.title}</h2>
            <p className="body-lg">{video.text}</p>
          </div>
          <div className="split__main">
            <Video id={video.youtube} title={video.title} large caption={<><span>{video.title}</span><span className="muted">youtube · {video.duration}</span></>} />
          </div>
        </div>
      </section>

      <section className="band band--red">
        <div className="wrap cta-band">
          <div className="stack">
            <h2 className="display display--md">{connect.title}</h2>
            <p className="body-lg">{connect.text}</p>
          </div>
          <div className="btn-row">
            <Link to="connect/" className="btn">Connect</Link>
            <a href="https://blackfacts.com" className="btn btn--outline-light">BlackFacts.com ↗</a>
          </div>
        </div>
      </section>
    </Page>
  );
}

