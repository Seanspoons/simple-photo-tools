import { RefObject } from 'react';
import { CollageLayoutCell } from '../../utils/collage/renderCollage';

interface CollagePreviewProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  hasImages: boolean;
  imageCount: number;
  canBuild: boolean;
  helperText?: string;
  previewCells?: CollageLayoutCell[];
  isInteractive?: boolean;
  draggedIndex?: number | null;
  dropTargetIndex?: number | null;
  onTileDragStart?: (index: number) => void;
  onTileDragEnter?: (index: number) => void;
  onTileDrop?: (index: number) => void;
  onTileDragEnd?: () => void;
}

export function CollagePreview({
  canvasRef,
  hasImages,
  imageCount,
  canBuild,
  helperText,
  previewCells = [],
  isInteractive = false,
  draggedIndex = null,
  dropTargetIndex = null,
  onTileDragStart,
  onTileDragEnter,
  onTileDrop,
  onTileDragEnd
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
            <>
              <canvas ref={canvasRef} className="preview-canvas" aria-label="Collage preview" />
              {isInteractive && previewCells.length > 0 ? (
                <div className="preview-dropzone-layer" aria-hidden="true">
                  {previewCells.map((cell, index) => (
                    <button
                      key={`${cell.x}-${cell.y}-${index}`}
                      type="button"
                      className={`preview-dropzone ${
                        draggedIndex === index ? 'is-dragging' : ''
                      } ${dropTargetIndex === index && draggedIndex !== index ? 'is-drop-target' : ''}`}
                      style={{
                        left: `${cell.x}px`,
                        top: `${cell.y}px`,
                        width: `${cell.width}px`,
                        height: `${cell.height}px`
                      }}
                      draggable
                      tabIndex={-1}
                      onDragStart={() => onTileDragStart?.(index)}
                      onDragEnter={() => onTileDragEnter?.(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onTileDrop?.(index)}
                      onDragEnd={() => onTileDragEnd?.()}
                    >
                      <span className="preview-dropzone-label">
                        {index === 0 ? 'Main' : `Move here`}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
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

      {helperText && canBuild ? (
        <div className="preview-footer">
          <p className="helper-text section-helper-text">{helperText}</p>
          {isInteractive ? (
            <p className="helper-text preview-desktop-note">
              Drag a tile to swap photo positions right here in the preview.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
