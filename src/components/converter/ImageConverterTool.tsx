import { useRef } from 'react';
import { UploadPanel } from '../UploadPanel';

export function ImageConverterTool() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      <section className="hero">
        <div className="hero-copy-block">
          <div>
            <p className="eyebrow">Image Converter</p>
            <h1>Change image format right in your browser.</h1>
            <p className="hero-copy">
              Convert images between JPG, PNG, and WebP with a simple private workflow that stays
              on your device.
            </p>
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-stat-label">How it works</p>
          <p className="hero-stat">Upload, choose a format, then save.</p>
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              JPEG, PNG, WebP, HEIC, and HEIF images can be opened here and converted locally.
            </p>
          </div>
        </div>
      </section>

      <section className="layout-grid watermark-layout-grid">
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
                  <p>Your image preview will appear here after you choose a file.</p>
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
                <h2>Choose format</h2>
              </div>
            </div>
            <div className="controls-grid">
              <label className="field">
                <span>Output format</span>
                <select disabled>
                  <option>JPEG</option>
                  <option>PNG</option>
                  <option>WebP</option>
                </select>
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Options</h2>
              </div>
            </div>
            <div className="tip-note panel-description" role="note">
              <span className="tip-note-icon" aria-hidden="true">
                i
              </span>
              <p className="helper-text">
                Quality and transparency options will appear here once your image is ready.
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
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
