// Runs at build time only (prerender.mjs): renders each route to HTML.
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { routes, MODE } from './content.js';

export { MODE };

export function pages() {
  return routes().map((r) => {
    const depth = r.path.split('/').filter(Boolean).length;
    const rel = depth ? '../'.repeat(depth) : './';
    const data = { page: r.page, rel, props: r.props };
    return { ...r, rel, data, html: renderToString(<App {...data} />) };
  });
}
