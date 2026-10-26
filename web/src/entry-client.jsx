// Runs in the browser: picks up the page the build already rendered and makes it interactive.
import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
// Fonts ship with the site (no Google request); latin subsets only.
import '@fontsource/anton/latin-400.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './site.css';

const data = JSON.parse(document.getElementById('page-data').textContent);
hydrateRoot(document.getElementById('root'), <App {...data} />);
