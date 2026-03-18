type RouteSeo = {
  title: string;
  description: string;
  canonicalPath: string;
  image: string;
  imageAlt: string;
};

const DEFAULT_TITLE = 'Simple Photo Tools';
const DEFAULT_DESCRIPTION =
  'Free browser-based photo tools for watermarking, collages, and image conversion, with no uploads to our server.';

export const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': {
    title: 'Simple Photo Tools | Free Browser-Based Photo Tools',
    description:
      'Free browser-based photo tools for watermarking, collages, and image conversion, with no uploads, no accounts, and no backend.',
    canonicalPath: '/',
    image: 'https://simplephototools.com/og-home.png',
    imageAlt: 'Simple Photo Tools homepage preview'
  },
  '/watermarker': {
    title: 'Photo Watermarker | Add Text, Logo, or Proof Watermarks',
    description:
      'Add text, logo, or proof-style watermarks to photos right in your browser. Private, simple, and fully client-side.',
    canonicalPath: '/watermarker',
    image: 'https://simplephototools.com/og-watermarker.png',
    imageAlt: 'Photo Watermarker preview card'
  },
  '/collage': {
    title: 'Collage Maker | Create Photo Collages in Your Browser',
    description:
      'Make clean photo collages in your browser with drag-to-arrange tiles, resize controls, and private client-side export.',
    canonicalPath: '/collage',
    image: 'https://simplephototools.com/og-collage.png',
    imageAlt: 'Collage Maker preview card'
  },
  '/convert': {
    title: 'Image Converter | Convert JPG, PNG, and WebP Online',
    description:
      'Convert images between JPG, PNG, and WebP in your browser. Open HEIC, HEIF, GIF, BMP, AVIF, and SVG files locally with no uploads.',
    canonicalPath: '/convert',
    image: 'https://simplephototools.com/og-convert.png',
    imageAlt: 'Image Converter preview card'
  },
  '/convert-heic-to-jpg': {
    title: 'Convert HEIC to JPG | Free Browser-Based Image Converter',
    description:
      'Convert HEIC and HEIF photos to JPG right in your browser with no uploads, no accounts, and no backend.',
    canonicalPath: '/convert-heic-to-jpg',
    image: 'https://simplephototools.com/og-convert.png',
    imageAlt: 'Convert HEIC to JPG landing page preview'
  },
  '/add-watermark-to-photo': {
    title: 'Add Watermark to Photo | Free Browser-Based Watermarker',
    description:
      'Add a text, logo, or proof watermark to a photo online in your browser, with no uploads and no account required.',
    canonicalPath: '/add-watermark-to-photo',
    image: 'https://simplephototools.com/og-watermarker.png',
    imageAlt: 'Add watermark to photo landing page preview'
  },
  '/make-photo-collage-online': {
    title: 'Make Photo Collage Online | Free Browser-Based Collage Maker',
    description:
      'Make a photo collage online in your browser with drag-to-arrange tiles, resize controls, and private local export.',
    canonicalPath: '/make-photo-collage-online',
    image: 'https://simplephototools.com/og-collage.png',
    imageAlt: 'Make photo collage online landing page preview'
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
    canonicalPath: '/',
    image: 'https://simplephototools.com/og-home.png',
    imageAlt: 'Simple Photo Tools homepage preview'
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

  const ogImage = ensureMeta('meta[property="og:image"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:image');
    return meta;
  });
  ogImage.setAttribute('content', seo.image);

  const ogImageAlt = ensureMeta('meta[property="og:image:alt"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:image:alt');
    return meta;
  });
  ogImageAlt.setAttribute('content', seo.imageAlt);

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

  const twitterImage = ensureMeta('meta[name="twitter:image"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:image');
    return meta;
  });
  twitterImage.setAttribute('content', seo.image);

  const twitterImageAlt = ensureMeta('meta[name="twitter:image:alt"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:image:alt');
    return meta;
  });
  twitterImageAlt.setAttribute('content', seo.imageAlt);

  const canonical = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    return link;
  });
  canonical.setAttribute('href', url);
}
