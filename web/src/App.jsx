import { Site } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Work from './pages/Work.jsx';
import Project from './pages/Project.jsx';
import Timeline from './pages/Timeline.jsx';
import Philosophy from './pages/Philosophy.jsx';
import Essay from './pages/Essay.jsx';
import Connect from './pages/Connect.jsx';

const PAGES = { Home, Work, Project, Timeline, Philosophy, Essay, Connect };

export default function App({ page, rel, props }) {
  const Page = PAGES[page];
  return (
    <Site.Provider value={{ rel, mode: props.mode }}>
      <Page {...props} />
    </Site.Provider>
  );
}
