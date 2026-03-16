import { RefObject } from 'react';

interface CollagePreviewProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  hasImages: boolean;
  imageCount: number;
  canBuild: boolean;
  helperText?: string;
}

export function CollagePreview({
  canvasRef,
  hasImages,
  imageCount,
  canBuild,
  helperText
}: CollagePreviewProps) {
  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>Preview</h2>
        </div>
        {hasImages ? <span className="dimension-badge">{imageCount} photos</span> : null}
      </div>

      <div className="preview-shell">
        {hasImages ? (
          canBuild ? (
            <canvas ref={canvasRef} className="preview-canvas" aria-label="Collage preview" />
          ) : (
            <div className="preview-placeholder">
              <p>{helperText ?? 'Add at least 2 photos to start your collage.'}</p>
            </div>
          )
        ) : (
          <div className="preview-placeholder">
            <p>Your collage preview will appear here once you add some photos.</p>
          </div>
        )}
      </div>

      {helperText && canBuild ? <p className="helper-text section-helper-text">{helperText}</p> : null}
    </section>
  );
}
