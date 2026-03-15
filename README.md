# Photo Watermarker

Photo Watermarker is a small React + TypeScript web app for adding text watermarks to photos entirely in the browser. It is installable as a PWA, works offline after the app shell is loaded, and does not use a backend or upload images to a server.

## Features

- Upload local JPEG, PNG, WebP, HEIC, or HEIF images
- Convert HEIC and HEIF to JPEG in the browser before processing
- Preview watermark changes instantly on a scaled preview canvas
- Export full-resolution JPEG or PNG files with the watermark applied
- Choose watermark text, corner, font, color, opacity, size, margin, bold, shadow, and background pill
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

## How HEIC support works

Most browsers do not decode HEIC or HEIF images natively. This app detects `.heic` and `.heif` files, or matching MIME types, and converts them client-side with `heic2any` before the normal preview and export pipeline runs. The converted image remains local to the browser session.

## How it works

- A file is selected with a standard file input using `accept="image/*,.heic,.heif"`.
- HEIC/HEIF files are converted locally to JPEG when needed.
- The preview is rendered on a smaller canvas for responsiveness.
- Export uses a hidden canvas at the original image dimensions to preserve full resolution.
- Watermark text is positioned with Canvas text measurement and exported with `canvas.toBlob()`.

## Project structure

```text
src/
  components/
    PreviewCanvas.tsx
    UploadPanel.tsx
    WatermarkControls.tsx
  utils/
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

- The app supports text watermarks only. It does not place image logos.
- HEIC conversion depends on browser memory limits for very large files.
- `navigator.share` is only available on supported mobile and desktop browsers.
- The PWA caches app assets for offline use, but it does not permanently cache user photos.
- The `Inter` option uses the local font if available and otherwise falls back to system sans-serif fonts.

## Notes

- Default JPEG export quality is high (`0.94`).
- Export keeps the original pixel dimensions and does not resize the image.
- Last-used watermark settings and export format are saved in `localStorage`.
- Custom presets are saved locally in the browser so repeat users can reuse the same setup quickly.
