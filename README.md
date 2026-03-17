# Photo Watermarker

A privacy-first, client-side image processing tool (PWA) for creating watermarks and collages directly in the browser.

Live site: https://photowatermarker.com

---

## Overview

Photo Watermarker is a lightweight web app built with React and TypeScript that allows users to:

- Add watermarks to photos
- Create collages from multiple images
- Export high-quality images

All processing happens entirely in the browser — no uploads, no accounts, no backend.

---

## Features

### Photo Watermarker

- Add **text or image (logo) watermarks**
- Single watermark or repeated **proof pattern**
- Customize:
  - Position
  - Size
  - Color
  - Opacity
  - Shadow
  - Background styling
- Instant preview
- Export as **JPEG or PNG**

---

### Collage Maker

- Upload multiple photos (2–25 images)
- Generate collages with **simple, guided layouts**
- Reorder images easily
- Select a **featured image** when supported by layout
- Live preview updates
- Export as **JPEG or PNG**

---

## Technical Highlights

- Fully **client-side image processing** using the Canvas API
- **No backend** — all images stay on the user’s device
- **HEIC / HEIF → JPEG conversion** in-browser using `heic2any`
- Dual rendering approach:
  - Low-resolution preview canvas for responsiveness
  - Full-resolution export canvas for final output
- Handles large images efficiently on modern devices
- Progressive Web App (PWA) with offline support

---

## Architecture

- React + TypeScript frontend
- Vite build system
- Canvas-based rendering pipeline
- Client-side file handling (Blob, ImageBitmap)
- No server, no API, no database

---

## Privacy

This app is designed to be privacy-friendly:

- No image uploads
- No server processing
- No accounts or tracking
- All work is done locally in the browser

---

## Running Locally

### Requirements
- Node.js 20+
- npm

### Install
```bash
npm install
```

### Start development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

---

## Notes

- Works offline after initial load (PWA)
- HEIC/HEIF images are converted locally before processing
- Drafts and settings are saved in localStorage
- Supports both watermarking and collage workflows
- Optimized for mobile and touch interaction

---

## Limitations

- Collage maker is intentionally **guided**, not a full design editor
- Very large images or large collage sets may impact performance on low-memory devices
- Watermark presets do not currently bundle uploaded image files
- Native share support depends on browser/device capabilities

---

## Project Structure

```
src/
  components/
    collage/
    watermark/
    PreviewCanvas.tsx
    UploadPanel.tsx
    WatermarkControls.tsx
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

---

## Why I Built This

I wanted a fast, simple photo tool that:

- Works well on mobile
- Is easy for non-technical users
- Respects user privacy
- Doesn’t require uploading personal photos to a server

---

## Future Improvements

- Batch watermarking
- Image (logo) watermark presets
- More collage layout presets
- Drag-based layout controls
- Additional export presets for social media
