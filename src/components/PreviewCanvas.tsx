import { RefObject } from 'react';

interface PreviewCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  beforeAfterMode: 'after' | 'before';
  dimensions?: { width: number; height: number };
  wasConverted?: boolean;
}

export function PreviewCanvas({
  canvasRef,
  hasImage,
  beforeAfterMode,
  dimensions,
  wasConverted = false
}: PreviewCanvasProps) {
  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Preview</h2>
        </div>
        {dimensions ? (
          <span className="dimension-badge">
            {dimensions.width} × {dimensions.height}px
          </span>
        ) : null}
      </div>

      <div className="preview-shell">
        {hasImage ? (
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            aria-label={
              beforeAfterMode === 'before'
                ? 'Original photo preview'
                : 'Watermarked photo preview'
            }
          />
        ) : (
          <div className="preview-placeholder">
            <p>Your image preview will appear here after you choose a photo.</p>
          </div>
        )}
      </div>

      {wasConverted ? (
        <p className="helper-text">HEIC/HEIF image converted locally to JPEG before rendering.</p>
      ) : null}
    </section>
  );
}
