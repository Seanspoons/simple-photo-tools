# Simple Photo Tools

Simple Photo Tools is a privacy-first web app for quick photo edits that run entirely in the browser.

Live site: https://simplephototools.com

Current tools:
- Photo Watermarker
- Collage Maker
- Image Converter

Planned next tools:
- Photo Resizer
- Image Compressor
- Border Maker

## What it does

### Photo Watermarker
- Add text or logo watermarks
- Use a single mark or a repeated proof pattern
- Adjust placement, size, color, opacity, shadow, and background styling
- Export as JPEG or PNG

### Collage Maker
- Upload multiple photos
- Arrange and resize tiles directly in the preview
- Export high-quality JPEG or PNG collages

### Image Converter
- Convert images between JPEG, PNG, and WebP
- Open JPEG, PNG, WebP, HEIC, and HEIF files locally
- Adjust quality for JPEG and WebP exports
- Fill transparent areas with a chosen background color when saving to JPEG

## Product direction

This project started as a watermarking app and is being expanded into a broader suite of browser-based photo tools. The homepage now acts as a simple tool hub, with dedicated routes for each tool:

- `/`
- `/watermarker`
- `/collage`
- `/convert`

Additional tools will be added over time.

## Privacy

All image processing happens locally in the browser.

- No uploads to our server
- No accounts
- No backend required
- Drafts and preferences stay on the device

## Tech

- React
- TypeScript
- Vite
- Canvas-based image rendering
- PWA support for offline app-shell usage
- `heic2any` for browser-side HEIC/HEIF conversion

## Running locally

Requirements:
- Node.js 20+
- npm

Install:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Notes

- The app works offline after the initial load
- The watermarker supports text, logo, and proof-style marks
- The collage maker is grid-based and intentionally guided rather than fully freeform
- Larger collage grids may need higher export quality on lower-memory devices

## Why I built it

I wanted a fast, simple set of photo tools that:

- work well on mobile and desktop
- are easy for non-technical users
- keep personal photos off random servers
- stay free and lightweight
