import { useEffect, useMemo, useState } from 'react';
import { CollageMaker } from './components/collage/CollageMaker';
import { ImageCompressorTool } from './components/compressor/ImageCompressorTool';
import { ImageConverterTool } from './components/converter/ImageConverterTool';
import { CropTool } from './components/crop/CropTool';
import { RemoveMetadataTool } from './components/metadata/RemoveMetadataTool';
import { RotateFlipTool } from './components/rotate/RotateFlipTool';
import { PhotoResizerTool } from './components/resizer/PhotoResizerTool';
import { applyRouteSeo } from './seo';
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
  | '/rotate-image-online'
  | '/social'
  | '/metadata'
  | '/remove-photo-metadata'
  | '/resize-image-online'
  | '/compress-image-online'
  | '/crop-image-online'
  | '/convert-image-online'
  | '/convert-heic-to-jpg'
  | '/add-watermark-to-photo'
  | '/make-photo-collage-online';

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
    | 'social'
    | 'metadata';
}

const LIVE_TOOL_LINKS: Array<{ path: AppRoute; label: string }> = [
  { path: '/watermarker', label: 'Watermarker' },
  { path: '/collage', label: 'Collage Maker' },
  { path: '/convert', label: 'Image Converter' },
  { path: '/resize', label: 'Photo Resizer' },
  { path: '/compress', label: 'Image Compressor' },
  { path: '/crop', label: 'Crop Tool' },
  { path: '/metadata', label: 'Remove Metadata' },
  { path: '/rotate', label: 'Rotate / Flip' }
];

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
    status: 'live',
    icon: 'resize'
  },
  {
    path: '/compress',
    name: 'Image Compressor',
    description: 'Make image files smaller without extra hassle.',
    blurb: 'Helpful when photos are too large to send or upload.',
    status: 'live',
    icon: 'compress'
  },
  {
    path: '/convert',
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, and WebP formats.',
    blurb: 'Helpful when you need a different image type.',
    status: 'live',
    icon: 'convert'
  },
  {
    path: '/crop',
    name: 'Crop Tool',
    description: 'Quickly crop images to the area you want.',
    blurb: 'Useful for cleaner framing and common aspect ratios.',
    status: 'live',
    icon: 'crop'
  },
  {
    path: '/rotate',
    name: 'Rotate / Flip',
    description: 'Rotate or flip images before saving.',
    blurb: 'Handy for quick fixes before you export.',
    status: 'live',
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
    path: '/metadata',
    name: 'Metadata Remover',
    description: 'Remove photo details before you share or save.',
    blurb: 'Helpful when you want a cleaner, more private file.',
    status: 'live',
    icon: 'metadata'
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
    cleanPath === '/rotate-image-online' ||
    cleanPath === '/social' ||
    cleanPath === '/metadata' ||
    cleanPath === '/remove-photo-metadata' ||
    cleanPath === '/resize-image-online' ||
    cleanPath === '/compress-image-online' ||
    cleanPath === '/crop-image-online' ||
    cleanPath === '/convert-image-online' ||
    cleanPath === '/convert-heic-to-jpg' ||
    cleanPath === '/add-watermark-to-photo' ||
    cleanPath === '/make-photo-collage-online'
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
              d="M11 12H22L26 16V34H11V12Z"
              className="icon-surface"
              strokeLinejoin="round"
            />
            <path d="M21 12V18H27" className="icon-accent-outline" strokeLinejoin="round" />
            <path
              d="M44 38H55L59 42V60H44V38Z"
              className="icon-surface-strong"
              strokeLinejoin="round"
            />
            <path d="M54 38V44H60" className="icon-accent-outline" strokeLinejoin="round" />
            <path
              d="M34 14C37.8928 14.4137 41.5786 15.9608 44.6005 18.4494C47.6224 20.938 49.8475 24.2588 51 28"
              className="icon-accent-stroke"
            />
            <path d="M52.9514 22.8276L51.3305 31.5811L46.1951 25.4436" className="icon-accent-stroke" />
            <path
              d="M37 56C33.1072 55.5863 29.4214 54.0392 26.3995 51.5506C23.3776 49.062 21.1525 45.7412 20 42"
              className="icon-accent-stroke"
            />
            <path d="M18.0166 47.8693L18.7819 39L24.4876 44.6111" className="icon-accent-stroke" />
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
            <path
              d="M24 18H22C17.5817 18 14 21.5817 14 26V42C14 46.4183 17.5817 50 22 50H24C28.4183 50 32 46.4183 32 42V26C32 21.5817 28.4183 18 24 18Z"
              className="icon-surface"
            />
            <path
              d="M50 14H46C42.134 14 39 17.134 39 21V25C39 28.866 42.134 32 46 32H50C53.866 32 57 28.866 57 25V21C57 17.134 53.866 14 50 14Z"
              className="icon-accent-soft-fill"
            />
            <path
              d="M52 38H44C39.5817 38 36 41.5817 36 46V50C36 54.4183 39.5817 58 44 58H52C56.4183 58 60 54.4183 60 50V46C60 41.5817 56.4183 38 52 38Z"
              className="icon-surface-strong"
            />
            <path d="M32 34L40 28" className="icon-accent-stroke" />
            <path d="M32 42L36 44" className="icon-accent-stroke" />
          </>
        ) : null}
        {kind === 'metadata' ? (
          <>
            <path
              d="M40 15H32C25.9249 15 21 19.9249 21 26V46C21 52.0751 25.9249 57 32 57H40C46.0751 57 51 52.0751 51 46V26C51 19.9249 46.0751 15 40 15Z"
              className="icon-surface"
            />
            <path d="M43 29L29 43" className="icon-accent-stroke" />
            <path d="M29 29L43 43" className="icon-accent-stroke" />
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
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const activeLabel =
    route === '/watermarker' || route === '/add-watermark-to-photo'
      ? 'Photo Watermarker'
      : route === '/collage' || route === '/make-photo-collage-online'
        ? 'Collage Maker'
        : route === '/convert' || route === '/convert-heic-to-jpg'
          || route === '/convert-image-online'
          ? 'Image Converter'
          : route === '/resize'
            || route === '/resize-image-online'
            ? 'Photo Resizer'
            : route === '/compress'
              || route === '/compress-image-online'
              ? 'Image Compressor'
              : route === '/crop' || route === '/crop-image-online'
                ? 'Crop Tool'
                : route === '/metadata' || route === '/remove-photo-metadata'
                  ? 'Remove Metadata'
                  : route === '/rotate'
                    ? 'Rotate / Flip'
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
              ? 'Use free online photo tools right in your browser for watermarking, collages, resizing, conversion, compression, cropping, and more, with no uploads to our server.'
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
        <div className="tool-menu">
          <button
            type="button"
            className={`tool-switch-button tool-menu-trigger ${!isHome ? 'is-active' : ''}`}
            aria-expanded={isToolMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsToolMenuOpen((current) => !current)}
          >
            <span>All Tools</span>
            <span className={`tool-menu-chevron ${isToolMenuOpen ? 'is-open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>
          {isToolMenuOpen ? (
            <div className="tool-menu-panel" role="menu" aria-label="Live tools">
              {LIVE_TOOL_LINKS.map((tool) => (
                <button
                  key={tool.path}
                  type="button"
                  role="menuitem"
                  className={`tool-menu-item ${route === tool.path ? 'is-active' : ''}`}
                  onClick={() => {
                    setIsToolMenuOpen(false);
                    onNavigate(tool.path);
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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

function LandingPage({
  eyebrow,
  title,
  copy,
  bulletA,
  bulletB,
  bulletC,
  ctaLabel,
  ctaPath,
  secondaryLabel,
  secondaryPath,
  onNavigate
}: {
  eyebrow: string;
  title: string;
  copy: string;
  bulletA: string;
  bulletB: string;
  bulletC: string;
  ctaLabel: string;
  ctaPath: AppRoute;
  secondaryLabel: string;
  secondaryPath: AppRoute;
  onNavigate: (path: AppRoute) => void;
}) {
  return (
    <section className="hero">
      <div className="hero-copy-block">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-copy">{copy}</p>
          <div className="hero-tags" aria-label="Highlights">
            <span className="hero-tag">{bulletA}</span>
            <span className="hero-tag">{bulletB}</span>
            <span className="hero-tag">{bulletC}</span>
          </div>
        </div>
      </div>
      <div className="hero-card">
        <p className="hero-stat-label">Start here</p>
        <p className="hero-stat">Use the matching tool right in your browser.</p>
        <div className="coming-soon-actions">
          <button type="button" className="primary-button" onClick={() => onNavigate(ctaPath)}>
            {ctaLabel}
          </button>
          <button type="button" className="secondary-button" onClick={() => onNavigate(secondaryPath)}>
            {secondaryLabel}
          </button>
        </div>
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

  useEffect(() => {
    applyRouteSeo(route);
  }, [route]);

  const routeContent = useMemo(() => {
    switch (route) {
      case '/watermarker':
        return <WatermarkTool />;
      case '/collage':
        return <CollageMaker />;
      case '/resize':
        return <PhotoResizerTool />;
      case '/compress':
        return <ImageCompressorTool />;
      case '/convert':
        return <ImageConverterTool />;
      case '/convert-heic-to-jpg':
        return (
          <LandingPage
            eyebrow="Convert HEIC to JPG"
            title="Convert HEIC photos to JPG without uploading them."
            copy="Open HEIC or HEIF images, switch the output to JPEG, and save a new browser-based copy in just a few taps."
            bulletA="HEIC and HEIF input"
            bulletB="JPG output"
            bulletC="Private in browser"
            ctaLabel="Open Image Converter"
            ctaPath="/convert"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/convert-image-online':
        return (
          <LandingPage
            eyebrow="Convert Image Online"
            title="Convert an image online without sending it to a server."
            copy="Open common image formats, switch to JPEG, PNG, or WebP, and save a converted file right in your browser."
            bulletA="JPEG, PNG, and WebP"
            bulletB="HEIC and HEIF input"
            bulletC="Private in browser"
            ctaLabel="Open Image Converter"
            ctaPath="/convert"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/resize-image-online':
        return (
          <LandingPage
            eyebrow="Resize Image Online"
            title="Resize an image online without uploading it anywhere."
            copy="Set a new width and height, keep the aspect ratio locked when you want to, and save a resized image right in your browser."
            bulletA="Width and height"
            bulletB="Aspect ratio lock"
            bulletC="Private in browser"
            ctaLabel="Open Photo Resizer"
            ctaPath="/resize"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/compress-image-online':
        return (
          <LandingPage
            eyebrow="Compress Image Online"
            title="Compress an image online to make the file smaller."
            copy="Lower image file size with simple browser-based controls for JPEG, PNG, and WebP without sending your photo to a server."
            bulletA="Smaller file sizes"
            bulletB="Simple quality controls"
            bulletC="Private in browser"
            ctaLabel="Open Image Compressor"
            ctaPath="/compress"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/crop-image-online':
        return (
          <LandingPage
            eyebrow="Crop Image Online"
            title="Crop an image online and keep only the part you want."
            copy="Drag the crop box, use a fixed ratio if you want one, and save the cropped result right in your browser."
            bulletA="Drag to crop"
            bulletB="Fixed ratios or free crop"
            bulletC="Private in browser"
            ctaLabel="Open Crop Tool"
            ctaPath="/crop"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/rotate-image-online':
        return (
          <LandingPage
            eyebrow="Rotate Image Online"
            title="Rotate or flip an image online without a full editor."
            copy="Use simple 90° rotate and mirror controls, preview the result live, and save the final image right in your browser."
            bulletA="Rotate left or right"
            bulletB="Flip horizontal or vertical"
            bulletC="Private in browser"
            ctaLabel="Open Rotate / Flip"
            ctaPath="/rotate"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/add-watermark-to-photo':
        return (
          <LandingPage
            eyebrow="Add Watermark to Photo"
            title="Add a text or logo watermark to a photo online."
            copy="Use the built-in watermarker to add text, logo, or proof-style marks right in your browser with no uploads to our server."
            bulletA="Text or logo"
            bulletB="Proof pattern"
            bulletC="Private in browser"
            ctaLabel="Open Watermarker"
            ctaPath="/watermarker"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/remove-photo-metadata':
        return (
          <LandingPage
            eyebrow="Remove Photo Metadata"
            title="Remove photo metadata before you share an image."
            copy="Review hidden details like camera, date, and location data, then save a cleaned copy right in your browser."
            bulletA="Metadata review"
            bulletB="Privacy focused"
            bulletC="Private in browser"
            ctaLabel="Open Remove Metadata"
            ctaPath="/metadata"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/make-photo-collage-online':
        return (
          <LandingPage
            eyebrow="Make Photo Collage Online"
            title="Make a photo collage online without a cluttered editor."
            copy="Upload your photos, arrange them directly in the preview, and export a clean collage right in your browser."
            bulletA="Drag to arrange"
            bulletB="Resize tiles"
            bulletC="Private in browser"
            ctaLabel="Open Collage Maker"
            ctaPath="/collage"
            secondaryLabel="Go Home"
            secondaryPath="/"
            onNavigate={navigateTo}
          />
        );
      case '/crop':
        return <CropTool />;
      case '/rotate':
        return <RotateFlipTool />;
      case '/social':
        return <ComingSoonPage toolName="Social Media Formatter" onNavigate={navigateTo} />;
      case '/metadata':
        return <RemoveMetadataTool />;
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
