import { useEffect, useMemo, useState } from 'react';
import { CollageMaker } from './components/collage/CollageMaker';
import { WatermarkTool } from './components/watermark/WatermarkTool';

type AppRoute = '/' | '/watermarker' | '/collage' | '/resize' | '/compress' | '/border';

interface ToolCard {
  path: AppRoute;
  name: string;
  description: string;
  status: 'live' | 'soon';
}

const TOOL_CARDS: ToolCard[] = [
  {
    path: '/watermarker',
    name: 'Photo Watermarker',
    description: 'Add a text or logo watermark, or make a proof-style preview image.',
    status: 'live'
  },
  {
    path: '/collage',
    name: 'Collage Maker',
    description: 'Arrange multiple photos into one image with a simple grid-based editor.',
    status: 'live'
  },
  {
    path: '/resize',
    name: 'Photo Resizer',
    description: 'Resize images for social posts, websites, and quick sharing.',
    status: 'soon'
  },
  {
    path: '/compress',
    name: 'Image Compressor',
    description: 'Shrink image file sizes while keeping them looking clean.',
    status: 'soon'
  },
  {
    path: '/border',
    name: 'Border Maker',
    description: 'Add clean padding or a simple border around your photos.',
    status: 'soon'
  }
];

function normalizeRoute(pathname: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/watermarker' || cleanPath === '/collage') {
    return cleanPath;
  }

  if (cleanPath === '/resize' || cleanPath === '/compress' || cleanPath === '/border') {
    return cleanPath;
  }

  return '/';
}

function navigateTo(path: AppRoute) {
  if (window.location.pathname === path) {
    return;
  }

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function RouteIntro({
  route,
  onNavigate
}: {
  route: AppRoute;
  onNavigate: (path: AppRoute) => void;
}) {
  const logoUrl = `${import.meta.env.BASE_URL}icon.svg`;
  const isHome = route === '/';
  const activeLabel =
    route === '/watermarker'
      ? 'Photo Watermarker'
      : route === '/collage'
        ? 'Collage Maker'
        : 'Coming Soon';

  return (
    <section className="site-intro panel">
      <div className="site-intro-copy">
        <div className="brand-mark" aria-hidden="true">
          <img src={logoUrl} alt="" />
        </div>
        <div>
          <p className="eyebrow">Simple Photo Tools</p>
          <h1>{isHome ? 'Free photo tools that stay on your device.' : activeLabel}</h1>
          <p className="hero-copy">
            {isHome
              ? 'Open the tool you need, edit your photo right in the browser, and save the result without uploading anything to a server.'
              : 'Part of Simple Photo Tools: quick, private photo tools that run right in your browser.'}
          </p>
        </div>
      </div>
      <div className="tool-switcher tool-switcher-suite" role="navigation" aria-label="Simple Photo Tools">
        <button
          type="button"
          className={`tool-switch-button ${route === '/' ? 'is-active' : ''}`}
          onClick={() => onNavigate('/')}
        >
          Home
        </button>
        <button
          type="button"
          className={`tool-switch-button ${route === '/watermarker' ? 'is-active' : ''}`}
          onClick={() => onNavigate('/watermarker')}
        >
          Watermarker
        </button>
        <button
          type="button"
          className={`tool-switch-button ${route === '/collage' ? 'is-active' : ''}`}
          onClick={() => onNavigate('/collage')}
        >
          Collage Maker
        </button>
      </div>
    </section>
  );
}

function HomePage({ onNavigate }: { onNavigate: (path: AppRoute) => void }) {
  return (
    <section className="suite-grid">
      {TOOL_CARDS.map((tool) => (
        <article key={tool.path} className="panel suite-card">
          <div className="suite-card-header">
            <div>
              <p className="eyebrow">{tool.status === 'live' ? 'Ready now' : 'Coming soon'}</p>
              <h2>{tool.name}</h2>
            </div>
            <span className={`suite-status-badge ${tool.status === 'live' ? 'is-live' : ''}`}>
              {tool.status === 'live' ? 'Live' : 'Soon'}
            </span>
          </div>
          <p className="suite-card-copy">{tool.description}</p>
          <button
            type="button"
            className={tool.status === 'live' ? 'primary-button' : 'secondary-button'}
            onClick={() => onNavigate(tool.path)}
          >
            {tool.status === 'live' ? `Open ${tool.name}` : 'View coming soon'}
          </button>
        </article>
      ))}
    </section>
  );
}

function ComingSoonPage({
  toolName,
  onNavigate
}: {
  toolName: string;
  onNavigate: (path: AppRoute) => void;
}) {
  return (
    <section className="panel coming-soon-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Coming Soon</p>
          <h2>{toolName}</h2>
        </div>
      </div>
      <p className="hero-copy">
        This tool is planned for Simple Photo Tools, but it is not ready yet.
      </p>
      <div className="coming-soon-actions">
        <button type="button" className="primary-button" onClick={() => onNavigate('/watermarker')}>
          Open Watermarker
        </button>
        <button type="button" className="secondary-button" onClick={() => onNavigate('/collage')}>
          Open Collage Maker
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const logoUrl = `${import.meta.env.BASE_URL}icon.svg`;
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const routeContent = useMemo(() => {
    switch (route) {
      case '/watermarker':
        return <WatermarkTool />;
      case '/collage':
        return <CollageMaker />;
      case '/resize':
        return <ComingSoonPage toolName="Photo Resizer" onNavigate={navigateTo} />;
      case '/compress':
        return <ComingSoonPage toolName="Image Compressor" onNavigate={navigateTo} />;
      case '/border':
        return <ComingSoonPage toolName="Border Maker" onNavigate={navigateTo} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  }, [route]);

  return (
    <div className="app-shell">
      <main className="app">
        <RouteIntro route={route} onNavigate={navigateTo} />
        {routeContent}
      </main>

      <footer className="site-footer">
        <div className="site-footer-card">
          <div className="site-footer-brand">
            <img src={logoUrl} alt="" aria-hidden="true" />
            <div>
              <p className="site-footer-title">Simple Photo Tools</p>
              <p className="site-footer-copy">
                Free photo tools that run in your browser, with no accounts and no uploads to our
                server.
              </p>
            </div>
          </div>
          <p className="site-footer-meta">
            © 2026 Simple Photo Tools. Watermarks, collages, and future tools stay on your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
