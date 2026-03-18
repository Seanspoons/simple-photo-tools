type RouteSeo = {
  title: string;
  description: string;
  canonicalPath: string;
};

const DEFAULT_TITLE = 'Simple Photo Tools';
const DEFAULT_DESCRIPTION =
  'Free browser-based photo tools for watermarking, collages, and image conversion, with no uploads to our server.';

export const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': {
    title: 'Simple Photo Tools | Free Browser-Based Photo Tools',
    description:
      'Free browser-based photo tools for watermarking, collages, and image conversion, with no uploads, no accounts, and no backend.',
    canonicalPath: '/'
  },
  '/watermarker': {
    title: 'Photo Watermarker | Add Text, Logo, or Proof Watermarks',
    description:
      'Add text, logo, or proof-style watermarks to photos right in your browser. Private, simple, and fully client-side.',
    canonicalPath: '/watermarker'
  },
  '/collage': {
    title: 'Collage Maker | Create Photo Collages in Your Browser',
    description:
      'Make clean photo collages in your browser with drag-to-arrange tiles, resize controls, and private client-side export.',
    canonicalPath: '/collage'
  },
  '/convert': {
    title: 'Image Converter | Convert JPG, PNG, and WebP Online',
    description:
      'Convert images between JPG, PNG, and WebP in your browser. Open HEIC, HEIF, GIF, BMP, AVIF, and SVG files locally with no uploads.',
    canonicalPath: '/convert'
  }
};

function ensureMeta(selector: string, create: () => HTMLElement): HTMLElement {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) {
    return existing;
  }

  const element = create();
  document.head.appendChild(element);
  return element;
}

export function applyRouteSeo(route: string) {
  const seo = ROUTE_SEO[route] ?? {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/'
  };
  const url = `https://simplephototools.com${seo.canonicalPath}`;

  document.title = seo.title;

  const descriptionMeta = ensureMeta('meta[name="description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    return meta;
  });
  descriptionMeta.setAttribute('content', seo.description);

  const ogTitle = ensureMeta('meta[property="og:title"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:title');
    return meta;
  });
  ogTitle.setAttribute('content', seo.title);

  const ogDescription = ensureMeta('meta[property="og:description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:description');
    return meta;
  });
  ogDescription.setAttribute('content', seo.description);

  const ogUrl = ensureMeta('meta[property="og:url"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:url');
    return meta;
  });
  ogUrl.setAttribute('content', url);

  const twitterTitle = ensureMeta('meta[name="twitter:title"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:title');
    return meta;
  });
  twitterTitle.setAttribute('content', seo.title);

  const twitterDescription = ensureMeta('meta[name="twitter:description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:description');
    return meta;
  });
  twitterDescription.setAttribute('content', seo.description);

  const canonical = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    return link;
  });
  canonical.setAttribute('href', url);
}
