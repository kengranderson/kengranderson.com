// The site's themes. Each id matches a :root[data-theme="<id>"] block in site.css.
// To add a theme: copy a block in site.css, give it a new id, add it here, then run
// npm run check:contrast. Plain JS (no JSX): prerender.mjs reads this file too.
export const THEMES = [
  { id: 'block-party', label: 'Block Party', note: 'Warm cream, marigold and plum. The default.' },
  { id: 'poster', label: 'Unapologetically Black', note: 'Red, white and black protest-poster signage.' },
  { id: 'pan-african', label: 'Pan-African', note: 'The red, black and green of the 1920 UNIA flag.' },
  { id: 'kente', label: 'Kente Gold', note: 'Gold, green and red woven bands, after Asante and Ewe kente.' },
  { id: 'harlem', label: 'Harlem Renaissance', note: 'Art Deco midnight, parchment and gold.' },
  { id: 'saint-lucia', label: 'Saint Lucia', note: 'Cerulean sea, gold sun and black, from the island’s flag.' },
  { id: 'afrofuturist', label: 'Afrofuturist', note: 'Night sky violet with gold and cyan. Dark.' }
];

export const DEFAULT_THEME = 'block-party';
// Used on a visitor's first visit when their device asks for dark mode.
export const DARK_THEME = 'afrofuturist';
export const STORAGE_KEY = 'kg-theme';

// Runs inline in <head> before the page paints, so a saved theme never flashes the default.
export const themeBootScript = () => `(function(){var d=document.documentElement,t;try{t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)<0)t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?${JSON.stringify(DARK_THEME)}:${JSON.stringify(DEFAULT_THEME)};d.setAttribute("data-theme",t);d.className+=" js"})()`;
