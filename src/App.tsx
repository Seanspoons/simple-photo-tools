import { useEffect, useMemo, useState } from 'react';
import { CollageMaker } from './components/collage/CollageMaker';
import { WatermarkTool } from './components/watermark/WatermarkTool';

type AppRoute =
  | '/'
  | '/watermarker'
  | '/collage'
  | '/resize'
  | '/compress'
  | '/border'
  | '/convert'
  | '/crop'
  | '/rotate'
  | '/social';

interface ToolCard {
  path: AppRoute;
  name: string;
  description: string;
  blurb: string;
  status: 'live' | 'soon';
  icon:
    | 'watermarker'
    | 'collage'
    | 'resize'
    | 'compress'
    | 'border'
    | 'convert'
    | 'crop'
    | 'rotate'
    | 'social';
}

const TOOL_CARDS: ToolCard[] = [
  {
    path: '/watermarker',
    name: 'Photo Watermarker',
    description: 'Add a text or logo watermark to a photo.',
    blurb: 'Great for artists, creators, and proof images.',
    status: 'live',
    icon: 'watermarker'
  },
  {
    path: '/collage',
    name: 'Collage Maker',
    description: 'Combine multiple photos into one image.',
    blurb: 'Arrange, resize, and save a clean collage.',
    status: 'live',
    icon: 'collage'
  },
  {
    path: '/resize',
    name: 'Photo Resizer',
    description: 'Resize photos for sharing and social posts.',
    blurb: 'Useful for Instagram, websites, and email.',
    status: 'soon',
    icon: 'resize'
  },
  {
    path: '/compress',
    name: 'Image Compressor',
    description: 'Make image files smaller without extra hassle.',
    blurb: 'Helpful when photos are too large to send or upload.',
    status: 'soon',
    icon: 'compress'
  },
  {
    path: '/convert',
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, and WebP formats.',
    blurb: 'Helpful when you need a different image type.',
    status: 'soon',
    icon: 'convert'
  },
  {
    path: '/crop',
    name: 'Crop Tool',
    description: 'Quickly crop images to the area you want.',
    blurb: 'Useful for cleaner framing and common aspect ratios.',
    status: 'soon',
    icon: 'crop'
  },
  {
    path: '/rotate',
    name: 'Rotate / Flip',
    description: 'Rotate or flip images before saving.',
    blurb: 'Handy for quick fixes before you export.',
    status: 'soon',
    icon: 'rotate'
  },
  {
    path: '/social',
    name: 'Social Media Formatter',
    description: 'Format images for Instagram, TikTok, and more.',
    blurb: 'Useful when one photo needs different social sizes.',
    status: 'soon',
    icon: 'social'
  },
  {
    path: '/border',
    name: 'Border Maker',
    description: 'Add padding or a simple border around a photo.',
    blurb: 'Useful for product shots and social posts.',
    status: 'soon',
    icon: 'border'
  }
];

function normalizeRoute(pathname: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/watermarker' || cleanPath === '/collage') {
    return cleanPath;
  }

  if (
    cleanPath === '/resize' ||
    cleanPath === '/compress' ||
    cleanPath === '/border' ||
    cleanPath === '/convert' ||
    cleanPath === '/crop' ||
    cleanPath === '/rotate' ||
    cleanPath === '/social'
  ) {
    return cleanPath;
  }

  return '/';
}

function resolveRouteFromLocation(locationLike: Pick<Location, 'pathname' | 'search'>): AppRoute {
  const redirectedPath = new URLSearchParams(locationLike.search).get('p');
  return normalizeRoute(redirectedPath || locationLike.pathname);
}

function navigateTo(path: AppRoute) {
  if (window.location.pathname === path) {
    return;
  }

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function ToolIcon({ kind }: { kind: ToolCard['icon'] }) {
  return (
    <span className={`suite-tool-icon suite-tool-icon-${kind}`} aria-hidden="true">
      <svg viewBox="0 0 72 72" className="suite-tool-icon-svg" focusable="false">
        {kind === 'watermarker' ? (
          <>
            <rect x="13" y="13" width="46" height="46" rx="15" className="icon-surface" />
            <path d="M23 41l8-18 8 18" className="icon-accent-stroke" />
            <path d="M26 34h10" className="icon-accent-stroke" />
            <rect x="36" y="40" width="14" height="7" rx="3.5" className="icon-accent-fill" />
          </>
        ) : null}
        {kind === 'collage' ? (
          <>
            <rect x="12" y="12" width="22" height="22" rx="8" className="icon-surface" />
            <rect x="38" y="12" width="22" height="15" rx="7" className="icon-surface" />
            <rect x="12" y="38" width="15" height="22" rx="7" className="icon-surface" />
            <rect x="31" y="31" width="29" height="29" rx="10" className="icon-accent-soft-fill" />
          </>
        ) : null}
        {kind === 'resize' ? (
          <>
            <rect x="18" y="18" width="36" height="36" rx="12" className="icon-surface" />
            <path d="M31 25h-7v7" className="icon-accent-stroke" />
            <path d="M41 25h7v7" className="icon-accent-stroke" />
            <path d="M31 47h-7v-7" className="icon-accent-stroke" />
            <path d="M41 47h7v-7" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'compress' ? (
          <>
            <rect x="16" y="20" width="40" height="32" rx="11" className="icon-surface" />
            <path d="M27 26v20" className="icon-accent-stroke" />
            <path d="M37 30v12" className="icon-accent-stroke" />
            <path d="M47 34v4" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'convert' ? (
          <>
            <path
              d="M21 21h11l4 4v18H21z"
              className="icon-surface"
              strokeLinejoin="round"
            />
            <path d="M32 21v5h5" className="icon-accent-outline" strokeLinejoin="round" />
            <path
              d="M36 35h11l4 4v18H36z"
              className="icon-surface-strong"
              strokeLinejoin="round"
            />
            <path d="M47 35v5h5" className="icon-accent-outline" strokeLinejoin="round" />
            <path d="M38 14a20 20 0 0 1 17 14" className="icon-accent-stroke" />
            <path d="M49.5 20.5l5.5 7-8-.2" className="icon-accent-stroke" />
            <path d="M34 59a20 20 0 0 1-17-14" className="icon-accent-stroke" />
            <path d="M22.5 52.5l-5.5-7 8 .2" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'crop' ? (
          <>
            <path
              d="M24 18v26a2.5 2.5 0 0 0 2.5 2.5H54"
              className="icon-accent-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 26h26a2.5 2.5 0 0 1 2.5 2.5V54"
              className="icon-accent-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        {kind === 'rotate' ? (
          <>
            <path d="M24 26a16 16 0 1 1-2 21" className="icon-accent-stroke" />
            <path d="M19 20v11h11" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'social' ? (
          <>
            <rect x="14" y="18" width="18" height="32" rx="8" className="icon-surface" />
            <rect x="39" y="14" width="18" height="18" rx="7" className="icon-accent-soft-fill" />
            <rect x="36" y="38" width="24" height="20" rx="8" className="icon-surface-strong" />
            <path d="M32 34l7-5" className="icon-accent-stroke" />
            <path d="M31 40l5 4" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'border' ? (
          <>
            <rect x="11" y="11" width="50" height="50" rx="17" className="icon-accent-soft-fill" />
            <rect x="19" y="19" width="34" height="34" rx="11" className="icon-surface-strong" />
            <rect x="25" y="25" width="22" height="22" rx="7" className="icon-surface" />
          </>
        ) : null}
      </svg>
    </span>
  );
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
          <h1>{isHome ? 'Simple photo tools that stay on your device.' : activeLabel}</h1>
          <p className="hero-copy">
            {isHome
              ? 'Pick the tool you need, make your edits in the browser, and save the result without uploading anything to our server.'
              : 'Part of Simple Photo Tools: private photo tools that run right in your browser.'}
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
            <div className="suite-card-title">
              <ToolIcon kind={tool.icon} />
              <h2>{tool.name}</h2>
            </div>
            {tool.status === 'soon' ? <span className="suite-status-note">Coming soon</span> : null}
          </div>
          <p className="suite-card-copy">{tool.description}</p>
          <p className="suite-card-blurb">{tool.blurb}</p>
          <button
            type="button"
            className={tool.status === 'live' ? 'primary-button' : 'secondary-button'}
            onClick={() => onNavigate(tool.path)}
          >
            {tool.status === 'live' ? 'Open tool' : 'Coming soon'}
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
  const [route, setRoute] = useState<AppRoute>(() => resolveRouteFromLocation(window.location));

  useEffect(() => {
    const redirectedPath = new URLSearchParams(window.location.search).get('p');
    if (redirectedPath) {
      const normalizedPath = normalizeRoute(redirectedPath);
      window.history.replaceState({}, '', normalizedPath);
      setRoute(normalizedPath);
    }

    const handleLocationChange = () => {
      setRoute(resolveRouteFromLocation(window.location));
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
      case '/convert':
        return <ComingSoonPage toolName="Image Converter" onNavigate={navigateTo} />;
      case '/crop':
        return <ComingSoonPage toolName="Crop Tool" onNavigate={navigateTo} />;
      case '/rotate':
        return <ComingSoonPage toolName="Rotate / Flip" onNavigate={navigateTo} />;
      case '/social':
        return <ComingSoonPage toolName="Social Media Formatter" onNavigate={navigateTo} />;
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
