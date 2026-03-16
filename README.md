# Photo Watermarker

Photo Watermarker is a small React + TypeScript web app with two browser-based photo tools:

- Photo Watermarker
- Collage Maker

It is installable as a PWA, works offline after the app shell is loaded, and does not use a backend or upload images to a server.

Live site: `https://photowatermarker.com`

## Features

- Add text or image watermarks to local JPEG, PNG, WebP, HEIC, or HEIF images
- Build collages from multiple local photos entirely in the browser
- Preview watermark and collage changes instantly on scaled preview canvases
- Export full-resolution JPEG or PNG files with the applied result
- Choose text or logo watermarks, single or proof layouts, expanded positions, opacity, size, spacing, and export type
- Choose collage output size, spacing, background, fit mode, and featured layout style
- Reorder collage photos, remove them, or move one to the featured spot
- Mobile-friendly UI with optional native share support on supported devices
- Local-only processing for privacy

## Privacy

Selected images are processed locally in the browser using Canvas and are not uploaded to a server. The app has no backend, no user accounts, and no cloud storage.

## Setup

### Requirements

- Node.js `20.19.0` or compatible
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build for production

```bash
npm run build
```

The production bundle is written to `dist/`.

## Deploy to GitHub Pages

This repo now includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds and deploys the app on every push to `main`.

### One-time GitHub Pages setup

1. Push the repo to GitHub.
2. In GitHub, open `Settings` > `Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` again, or run the workflow manually.

This repo is now configured for a custom domain deployment with `photowatermarker.com` and includes a `public/CNAME` file for GitHub Pages.

If you stay on the custom domain, the current workflow is correct.

If you later want to serve the app from the default GitHub Pages repo URL instead, the Vite base path and workflow build step would need to be switched back to the repo subpath.

## Tools

### Photo Watermarker

The watermark tool is designed for quick but flexible single-image watermarking. It keeps the workflow simple:

1. choose a photo
2. choose a text or logo watermark
3. choose a single mark or a repeated proof pattern
4. adjust the style and placement
5. preview the result
6. save the finished image

The watermark maker currently supports:

- Text watermarks with font, color, bold, shadow, and background styling
- Image/logo watermarks using a locally selected image file
- Single watermark placement with corners, center positions, and edge spacing
- Proof-style repeated watermark patterns with adjustable spacing and angle
- Local draft restore so the current photo and watermark settings survive a refresh

### Collage Maker

The collage tool is designed for simple multi-photo layouts without requiring design software. It keeps the workflow focused on:

1. add photos
2. choose a layout mode
3. adjust spacing, background, and fit
4. preview the collage
5. save the finished image

The collage maker currently supports:

- Balanced layouts for 2 to 4 photos so small collages feel more natural
- Equal-tile layouts for larger photo sets
- Featured layouts where the first image is given more visual weight
- Social-friendly output presets such as square, portrait, and story sizes
- Mixed portrait, landscape, and square photos
- Up to 25 photos per collage

Odd image counts are handled with balanced final rows and guided layouts rather than leaving awkward empty holes.

## Image format support

Most browsers do not decode HEIC or HEIF images natively. This app detects `.heic` and `.heif` files, or matching MIME types, and converts them client-side with `heic2any` before the normal preview and export pipeline runs. The converted image remains local to the browser session.

## How it works

- A file is selected with a standard file input using `accept="image/*,.heic,.heif"`.
- HEIC/HEIF files are converted locally to JPEG when needed.
- The preview is rendered on a smaller canvas for responsiveness.
- Export uses a hidden canvas at the original image dimensions or preset collage size to preserve full resolution.
- Watermarks are rendered with the Canvas 2D API as either text or image layers, including repeated proof patterns.
- Collage layouts are generated with simple client-side layout templates rather than a freeform editor.

## Project structure

```text
src/
  components/
    collage/
    PreviewCanvas.tsx
    UploadPanel.tsx
    WatermarkControls.tsx
    watermark/
  utils/
    collage/
    exportImage.ts
    heicConversion.ts
    imageLoader.ts
    renderWatermark.ts
  App.tsx
  constants.ts
  main.tsx
  styles.css
  types.ts
```

## Limitations

- Watermark image uploads are local to the current draft or session and are not bundled into named presets.
- The collage maker uses guided layouts rather than a full freeform editor.
- HEIC conversion depends on browser memory limits for very large files.
- Very large collage image sets can use significant memory on mobile devices.
- `navigator.share` is only available on supported mobile and desktop browsers.
- The PWA caches app assets for offline use, but it does not permanently cache user photos.
- The script-style font depends on browser font rendering and may look slightly different across devices.

## Notes

- Default JPEG export quality is high (`0.94`).
- Export keeps the original pixel dimensions and does not resize the image.
- Last-used watermark settings, current drafts, and export format are saved locally in the browser.
- Custom presets are saved locally in the browser so repeat users can reuse the same setup quickly.
- Collage output sizes follow preset social-friendly dimensions rather than freeform custom sizes.
