import {
  DragEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { CollageLayoutCell, CollageLayoutFrame } from '../../utils/collage/renderCollage';

interface CollagePreviewProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  hasImages: boolean;
  imageCount: number;
  canBuild: boolean;
  helperText?: string;
  exportFrameNote?: string;
  previewCells?: CollageLayoutCell[];
  previewFrame?: CollageLayoutFrame;
  previewCornerRadius?: number;
  previewImageUrls?: string[];
  isInteractive?: boolean;
  selectedIndex?: number;
  draggedIndex?: number | null;
  dropTargetIndex?: number | null;
  onTileSelect?: (index: number) => void;
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
  exportFrameNote,
  previewCells = [],
  previewFrame,
  previewCornerRadius = 0,
  previewImageUrls = [],
  isInteractive = false,
  selectedIndex = 0,
  draggedIndex = null,
  dropTargetIndex = null,
  onTileSelect,
  onTileDragStart,
  onTileDragEnter,
  onTileDrop,
  onTileDragEnd
}: CollagePreviewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      setDisplaySize({
        width: canvas.clientWidth,
        height: canvas.clientHeight
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(shellRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, canBuild, hasImages, previewCells.length]);

  const scaledCells = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas || displaySize.width === 0 || displaySize.height === 0) {
      return [];
    }

    const scaleX = displaySize.width / canvas.width;
    const scaleY = displaySize.height / canvas.height;

    const scale = Math.min(scaleX, scaleY);

    return previewCells.map((cell) => ({
      x: cell.x * scaleX,
      y: cell.y * scaleY,
      width: cell.width * scaleX,
      height: cell.height * scaleY,
      borderRadius: previewCornerRadius * scale
    }));
  }, [canvasRef, displaySize.height, displaySize.width, previewCells, previewCornerRadius]);

  const scaledFrame = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewFrame || displaySize.width === 0 || displaySize.height === 0) {
      return null;
    }

    const scaleX = displaySize.width / canvas.width;
    const scaleY = displaySize.height / canvas.height;

    return {
      x: previewFrame.x * scaleX,
      y: previewFrame.y * scaleY,
      width: previewFrame.width * scaleX,
      height: previewFrame.height * scaleY
    };
  }, [canvasRef, displaySize.height, displaySize.width, previewFrame]);

  const handleTileDragStart = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    const previewImageUrl = previewImageUrls[index];
    if (previewImageUrl) {
      const dragImage = document.createElement('img');
      dragImage.src = previewImageUrl;
      dragImage.width = 96;
      dragImage.height = 96;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      dragImage.style.left = '-9999px';
      dragImage.style.borderRadius = '16px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 48, 48);
      requestAnimationFrame(() => dragImage.remove());
    }

    onTileDragStart?.(index);
  };

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>Preview</h2>
        </div>
        {hasImages ? <span className="dimension-badge">{imageCount} photos</span> : null}
      </div>

      <div ref={shellRef} className="preview-shell collage-preview-shell">
        {hasImages ? (
          canBuild ? (
            <>
              <canvas
                ref={canvasRef}
                className="preview-canvas collage-preview-canvas"
                aria-label="Collage preview"
              />
              {isInteractive && scaledCells.length > 0 && scaledFrame ? (
                <div
                  className="preview-dropzone-layer"
                  aria-hidden="true"
                  style={{
                    left: '0px',
                    top: '0px',
                    width: `${displaySize.width}px`,
                    height: `${displaySize.height}px`
                  }}
                >
                  {scaledCells.map((cell, index) => (
                    <button
                      key={`${cell.x}-${cell.y}-${index}`}
                      type="button"
                      className={`preview-dropzone ${
                        selectedIndex === index ? 'is-selected' : ''
                      } ${
                        draggedIndex === index ? 'is-dragging' : ''
                      } ${dropTargetIndex === index && draggedIndex !== index ? 'is-drop-target' : ''} ${
                        hoveredIndex === index && draggedIndex === null ? 'is-hovered' : ''
                      }`}
                      style={{
                        left: `${cell.x}px`,
                        top: `${cell.y}px`,
                        width: `${cell.width}px`,
                        height: `${cell.height}px`,
                        borderRadius: `${cell.borderRadius}px`
                      }}
                      draggable
                      tabIndex={-1}
                      onClick={() => onTileSelect?.(index)}
                      onDragStart={(event) => handleTileDragStart(event, index)}
                      onDragEnter={() => onTileDragEnter?.(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onTileDrop?.(index)}
                      onDragEnd={() => onTileDragEnd?.()}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <span className="preview-dropzone-label">
                        {index === 0 ? 'Main photo' : 'Swap here'}
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
          <p className="helper-text panel-description panel-description-tight">{helperText}</p>
          {isInteractive || exportFrameNote ? (
            <p className="helper-text preview-desktop-note">
              {isInteractive ? 'Drag a tile to swap photo positions right here in the preview.' : ''}
              {isInteractive && exportFrameNote ? ' ' : ''}
              {exportFrameNote ?? ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
