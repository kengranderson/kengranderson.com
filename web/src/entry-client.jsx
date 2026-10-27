// Runs in the browser: picks up the page the build already rendered and makes it interactive.
import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
// The one stylesheet; it also loads the self-hosted fonts.
import './site.css';

const data = JSON.parse(document.getElementById('page-data').textContent);
hydrateRoot(document.getElementById('root'), <App {...data} />);
