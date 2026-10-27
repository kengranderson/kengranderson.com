import { useEffect, useState } from 'react';
import { Link, useHref, useSite } from './ui.jsx';
import { THEMES, DEFAULT_THEME, STORAGE_KEY } from '../themes.js';

// The theme drop-down. The <head> script has already applied the saved theme before paint;
// this only reads it back and saves a new choice. Hidden without JavaScript (see .theme-picker).
export function ThemePicker() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  useEffect(() => { setTheme(document.documentElement.getAttribute('data-theme') || DEFAULT_THEME); }, []);
  const choose = (e) => {
    const t = e.target.value;
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode: the choice lasts for this page only */ }
  };
  return (
    <label className="theme-picker">
      <span className="theme-picker__label">Theme</span>
      <select className="theme-picker__select" value={theme} onChange={choose}>
        {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
    </label>
  );
}

export function Header({ nav, name, current }) {
  const [open, setOpen] = useState(false);
  const href = useHref();
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <a href={href('') || './'} className="brand">
          <img src={href('images/brand/ken-logo-pixel.jpg')} alt="" width="52" height="52" className="brand__logo" />
          <span className="brand__name">{name}</span>
        </a>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={open ? 'M5 5l14 14M19 5L5 19' : 'M3 6h18M3 12h18M3 18h18'} stroke="currentColor" strokeWidth="2.5" fill="none"></path></svg>
        </button>
        <div id="site-nav" className={`site-menu${open ? ' is-open' : ''}`}>
          <nav aria-label="Main" className="site-nav">
            {nav.filter((n) => n.path != null).map((n) => (
              <Link key={n.page} to={n.path} className={`site-nav__link${n.page === 'connect' ? ' site-nav__link--cta' : ''}`} aria-current={n.page === current ? 'page' : undefined}>{n.label}</Link>
            ))}
          </nav>
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}

export function Footer({ motto, links }) {
  const { mode } = useSite();
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <div className="site-footer__motto">
          <span>{motto[0]} <span className="red">{motto[1]}</span></span>
          <small>This site is maintained by AI agents through GitHub. Built the way I build.</small>
        </div>
        <nav aria-label="Footer" className="site-footer__links">
          {links.map((l) => (l.url ? <a key={l.label} href={l.url}>{l.label}</a> : mode === 'preview' ? <span key={l.label}>{l.label} [URL]</span> : null))}
        </nav>
      </div>
    </footer>
  );
}

export function Page({ props, current, children }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header nav={props.nav} name={props.name} current={current} />
      {props.mode === 'preview' && (
        <div className="preview-bar">Preview build: drafts, VERIFY flags and missing-fact notes are visible. They never appear in production.</div>
      )}
      <main id="main">{children}</main>
      <Footer motto={props.motto} links={props.links} />
    </>
  );
}
