// The site's components. Class names match the .classes in site.css one for one.
import { createContext, useContext, useState } from 'react';

// rel = the path back to the site root from the current page ("./", "../", "../../"),
// so every link stays relative and the site works from any folder.
export const Site = createContext({ rel: './', mode: 'production' });
export const useSite = () => useContext(Site);

export function useHref() {
  const { rel } = useSite();
  return (path) => (path == null ? null : /^(https?:|mailto:|#)/.test(path) ? path : rel + path);
}

// HTML written inside highlights.json (descriptions, postscripts) uses site-root paths
// like images/x.jpg; point them back at the root from whatever folder the page is in.
export function useRelHtml() {
  const { rel } = useSite();
  return (html) => html && html.replace(/(src|href)="(?![a-z][a-z0-9+.-]*:|#|\/)/gi, `$1="${rel}`);
}

export function Link({ to, className, children, ...rest }) {
  const href = useHref();
  if (to == null) return <span className={className ? `${className} is-pending` : 'is-pending'} {...rest}>{children}</span>;
  return <a href={href(to)} className={className} {...rest}>{children}</a>;
}

const STATUS_LABEL = { live: 'Live', maintained: 'Maintained', archived: 'Archived' };

export function Chip({ status, label }) {
  const { mode } = useSite();
  if (!status && mode !== 'preview') return null;
  return (
    <span className="chip" data-status={status || 'unknown'}>
      <span className="chip__mark" aria-hidden="true"></span>
      {label || STATUS_LABEL[status] || 'Status TBD'}
    </span>
  );
}

// Editorial flag. Only ever rendered in preview builds.
export function Verify({ children = 'Verify · source needed' }) {
  const { mode } = useSite();
  if (mode !== 'preview') return null;
  return <span className="verify">{children}</span>;
}

export function Draft({ publish }) {
  const { mode } = useSite();
  if (mode !== 'preview' || publish === 'published') return null;
  return <span className="verify verify--draft">{publish}</span>;
}

export function Needs({ items }) {
  const { mode } = useSite();
  if (mode !== 'preview' || !items?.length) return null;
  return (
    <aside className="needs" aria-label="Missing before publishing">
      <strong>Before this goes live, Ken to supply:</strong>
      <ul>{items.map((n) => <li key={n}>{n}</li>)}</ul>
    </aside>
  );
}

export function Years({ start, end, ongoing }) {
  if (start == null) return <span className="mono">[YEAR]{ongoing ? ' →' : ''}</span>;
  return <span className="mono">{start}{end ? `–${end}` : ongoing ? ' →' : ''}</span>;
}

export function SectionHead({ num, title, aside }) {
  return (
    <div className="section-head">
      {num && <span className="section-head__num">{num}</span>}
      <h2 className="section-head__title">{title}</h2>
      {aside && <span className="section-head__aside">{aside}</span>}
    </div>
  );
}

export function Placeholder({ children, className = '' }) {
  return <div className={`placeholder ${className}`}><span>{children}</span></div>;
}

// Thumbnail first; the YouTube player only loads when someone taps it.
export function Video({ id, title, caption, large }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="video">
      <div className="video__frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <a
            className="video__poster"
            href={`https://www.youtube.com/watch?v=${id}`}
            aria-label={`Play video: ${title}`}
            onClick={(e) => { e.preventDefault(); setPlaying(true); }}
          >
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className={`video__play${large ? ' video__play--lg' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"></path></svg>
            </span>
          </a>
        )}
      </div>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}

export function Exhibit({ src, alt, caption, fit = 'cover', className = '' }) {
  const href = useHref();
  return (
    <figure className={`exhibit ${className}`}>
      <a href={href(src)} className="exhibit__img">
        <img src={href(src)} alt={alt} loading="lazy" style={fit === 'contain' ? { objectFit: 'contain' } : undefined} />
      </a>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}

const DOC_LABEL = { pdf: 'PDF', ppt: 'PPT', pptx: 'PPTX', pps: 'PPS', ppsx: 'PPSX', doc: 'DOC', docx: 'DOCX' };

export function DocLink({ src, ext, name }) {
  const href = useHref();
  return (
    <a className="evidence" href={href(src)}>
      <span className="evidence__kind evidence__kind--red">{DOC_LABEL[ext] || ext.toUpperCase()}</span>
      <span className="evidence__title">{name}</span>
      <span className="evidence__arrow" aria-hidden="true">↓</span>
    </a>
  );
}

export function Evidence({ kind, title, href: to }) {
  const href = useHref();
  return (
    <a className="evidence" href={href(to)}>
      <span className="evidence__kind">{kind}</span>
      <span className="evidence__title">{title}</span>
      <span className="evidence__arrow" aria-hidden="true">↗</span>
    </a>
  );
}

export function PullQuote({ text, accent, cite }) {
  return (
    <blockquote className="pullquote">
      <p>{text} {accent && <span className="red">{accent}</span>}</p>
      {cite && <cite>{cite}</cite>}
    </blockquote>
  );
}

export function ProjectCard({ p, big }) {
  const href = useHref();
  return (
    <Link to={p.path} className={`card${big ? ' card--big' : ''}`}>
      {p.image ? (
        <img className="card__img" src={href(p.image)} alt={p.imageAlt} loading="lazy" style={p.imageFit === 'contain' ? { objectFit: 'contain', background: '#fff' } : undefined} />
      ) : (
        <Placeholder className="card__img">{p.flagship ? 'Asset map screenshot' : 'Screenshot'}</Placeholder>
      )}
      <span className="card__body">
        <span className="card__meta"><Chip status={p.status} label={p.flagship && p.status === 'live' ? 'Live · Flagship' : undefined} /><Draft publish={p.publish} /><Years start={p.start} end={p.end} ongoing={p.status === 'live' || p.status === 'maintained'} /></span>
        <span className="card__title">{p.title}</span>
        <span className="card__text">{p.summary}</span>
        {p.served && <span className="card__foot">Served: {p.served}</span>}
      </span>
    </Link>
  );
}
