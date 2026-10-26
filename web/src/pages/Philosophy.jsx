import { Page } from '../components/Layout.jsx';
import { Link } from '../components/ui.jsx';

export default function Philosophy(props) {
  return (
    <Page props={props} current="philosophy">
      <section className="band band--tight">
        <div className="wrap stack">
          <h1 className="display">My Philosophy</h1>
          <p className="lede">The principles behind the work. Each one links to the projects where it shows up.</p>
        </div>
      </section>
      <section className="band">
        <div className="wrap">
          <ol className="principle-list">
            {props.principles.map((p, i) => (
              <li key={p.slug}>
                <Link to={p.path} className="principle-list__item">
                  <span className="mono red">{String(i + 1).padStart(2, '0')}</span>
                  <span className="principle-list__main">
                    <span className="h2">{p.title}</span>
                    {p.dek && <span className="body muted">{p.dek}</span>}
                  </span>
                  <span className="mono">{p.path != null ? 'Read →' : 'Coming'}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Page>
  );
}
