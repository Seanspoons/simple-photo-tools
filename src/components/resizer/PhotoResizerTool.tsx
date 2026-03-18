import { useRef } from 'react';
import { UploadPanel } from '../UploadPanel';

export function PhotoResizerTool() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      <section className="hero">
        <div className="hero-copy-block">
          <div>
            <p className="eyebrow">Photo Resizer</p>
            <h1>Resize images for sharing, websites, and email.</h1>
            <p className="hero-copy">
              Change image dimensions right in your browser with a simple size workflow and no uploads.
            </p>
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-stat-label">How it works</p>
          <p className="hero-stat">Upload, set a new size, then save.</p>
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              Keep the aspect ratio locked by default, then continue to compression if you want a smaller file too.
            </p>
          </div>
        </div>
      </section>

      <section className="layout-grid converter-layout-grid">
        <div className="left-column">
          <UploadPanel onFileSelect={() => undefined} />
          <div className="preview-sticky-wrap">
            <section className="panel preview-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h2>Your image</h2>
                </div>
              </div>
              <div className="preview-shell watermark-preview-shell">
                <div className="preview-placeholder">
                  <p>Your resized preview will appear here after you choose a photo.</p>
                </div>
                <canvas ref={previewCanvasRef} className="preview-canvas sr-only" aria-hidden="true" />
              </div>
            </section>
          </div>
        </div>

        <div className="right-column">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>Set new size</h2>
              </div>
            </div>
            <div className="controls-grid">
              <label className="field">
                <span>Width</span>
                <input type="text" value="" readOnly />
              </label>
              <label className="field">
                <span>Height</span>
                <input type="text" value="" readOnly />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Preview result</h2>
              </div>
            </div>
            <div className="tip-note panel-description" role="note">
              <span className="tip-note-icon" aria-hidden="true">
                i
              </span>
              <p className="helper-text">
                Original and resized dimensions will appear here once your photo is ready.
              </p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Export</h2>
              </div>
            </div>
            <div className="export-actions">
              <button type="button" className="primary-button" disabled>
                Save Image
              </button>
              <button type="button" className="ghost-button" disabled>
                Compress this image
              </button>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
