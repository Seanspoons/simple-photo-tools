import {
  DragEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  CollageLayoutMetrics,
  CollagePackedTile
} from '../../utils/collage/renderCollage';

interface CollagePreviewProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  hasImages: boolean;
  imageCount: number;
  canBuild: boolean;
  helperText?: string;
  exportFrameNote?: string;
  previewCells?: CollagePackedTile[];
  previewMetrics?: CollageLayoutMetrics | null;
  gap?: number;
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
  onTileResizePreview?: (index: number, colSpan: number, rowSpan: number) => void;
  onTileResizeCommit?: (index: number, colSpan: number, rowSpan: number) => void;
  onTileResizeCancel?: () => void;
}

export function CollagePreview({
  canvasRef,
  hasImages,
  imageCount,
  canBuild,
  helperText,
  exportFrameNote,
  previewCells = [],
  previewMetrics = null,
  gap = 0,
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
  onTileDragEnd,
  onTileResizePreview,
  onTileResizeCommit,
  onTileResizeCancel
}: CollagePreviewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const dragImageRef = useRef<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const resizeStateRef = useRef<{
    index: number;
    pointerId: number;
    mode: 'right' | 'bottom' | 'corner';
    startX: number;
    startY: number;
    startColSpan: number;
    startRowSpan: number;
    nextColSpan: number;
    nextRowSpan: number;
    maxColSpan: number;
  } | null>(null);

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
      index: cell.index,
      column: cell.column,
      row: cell.row,
      colSpan: cell.colSpan,
      rowSpan: cell.rowSpan,
      x: cell.x * scaleX,
      y: cell.y * scaleY,
      width: cell.width * scaleX,
      height: cell.height * scaleY,
      borderRadius: previewCornerRadius * scale
    }));
  }, [canvasRef, displaySize.height, displaySize.width, previewCells, previewCornerRadius]);

  const scaledFrame = useMemo(() => {
    if (scaledCells.length === 0) {
      return null;
    }

    return {
      x: Math.min(...scaledCells.map((cell) => cell.x)),
      y: Math.min(...scaledCells.map((cell) => cell.y)),
      width:
        Math.max(...scaledCells.map((cell) => cell.x + cell.width)) -
        Math.min(...scaledCells.map((cell) => cell.x)),
      height:
        Math.max(...scaledCells.map((cell) => cell.y + cell.height)) -
        Math.min(...scaledCells.map((cell) => cell.y))
    };
  }, [scaledCells]);

  const handleTileDragStart = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));

    if (dragImageRef.current) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }

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
      dragImage.style.pointerEvents = 'none';
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;
      event.dataTransfer.setDragImage(dragImage, 48, 48);
    }

    onTileDragStart?.(index);
  };

  const handleTileDragEnd = () => {
    if (dragImageRef.current) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }

    onTileDragEnd?.();
  };

  const handleResizeStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cell: (typeof scaledCells)[number],
    mode: 'right' | 'bottom' | 'corner'
  ) => {
    if (!previewMetrics) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      index: cell.index,
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startColSpan: cell.colSpan,
      startRowSpan: cell.rowSpan,
      nextColSpan: cell.colSpan,
      nextRowSpan: cell.rowSpan,
      maxColSpan: Math.max(1, previewMetrics.columns - cell.column)
    };
    onTileSelect?.(cell.index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizeMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizeState = resizeStateRef.current;
    const canvas = canvasRef.current;
    if (!resizeState || !previewMetrics || !canvas) {
      return;
    }

    const scaleX = displaySize.width / canvas.width;
    const scaleY = displaySize.height / canvas.height;
    const horizontalStep = (previewMetrics.cellSize + gap) * scaleX;
    const verticalStep = (previewMetrics.cellSize + gap) * scaleY;
    const snapUnits = (distance: number, step: number) => {
      const raw = distance / Math.max(step, 1);
      return raw >= 0 ? Math.floor(raw + 0.35) : Math.ceil(raw - 0.35);
    };

    const rawDeltaColumns = event.clientX - resizeState.startX;
    const rawDeltaRows = event.clientY - resizeState.startY;
    const deltaColumns =
      resizeState.mode === 'bottom' ? 0 : snapUnits(rawDeltaColumns, horizontalStep);
    const deltaRows =
      resizeState.mode === 'right' ? 0 : snapUnits(rawDeltaRows, verticalStep);

    const squareDelta =
      resizeState.mode === 'corner'
        ? snapUnits(
            ((event.clientX - resizeState.startX) / Math.max(horizontalStep, 1) +
              (event.clientY - resizeState.startY) / Math.max(verticalStep, 1)) /
              2,
            1
          )
        : 0;

    const nextColSpan = Math.min(
      resizeState.maxColSpan,
      Math.max(
        1,
        resizeState.startColSpan + (resizeState.mode === 'corner' ? squareDelta : deltaColumns)
      )
    );
    const nextRowSpan = Math.min(
      4,
      Math.max(
        1,
        resizeState.startRowSpan + (resizeState.mode === 'corner' ? squareDelta : deltaRows)
      )
    );

    resizeState.nextColSpan = nextColSpan;
    resizeState.nextRowSpan = nextRowSpan;
    onTileResizePreview?.(resizeState.index, nextColSpan, nextRowSpan);
  };

  const handleResizeEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) {
      return;
    }

    if (event.pointerId === resizeState.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onTileResizeCommit?.(resizeState.index, resizeState.nextColSpan, resizeState.nextRowSpan);
    resizeStateRef.current = null;
  };

  const handleResizeCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) {
      return;
    }

    if (event.pointerId === resizeState.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeStateRef.current = null;
    onTileResizeCancel?.();
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
                      onDragEnd={handleTileDragEnd}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <span className="preview-dropzone-label">
                        Drag to move
                      </span>
                      <button
                        type="button"
                        className="preview-resize-handle preview-resize-handle-right"
                        aria-label="Resize wider"
                        tabIndex={-1}
                        onPointerDown={(event) => handleResizeStart(event, cell, 'right')}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeCancel}
                      />
                      <button
                        type="button"
                        className="preview-resize-handle preview-resize-handle-bottom"
                        aria-label="Resize taller"
                        tabIndex={-1}
                        onPointerDown={(event) => handleResizeStart(event, cell, 'bottom')}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeCancel}
                      />
                      <button
                        type="button"
                        className="preview-resize-handle preview-resize-handle-corner"
                        aria-label="Resize larger"
                        tabIndex={-1}
                        onPointerDown={(event) => handleResizeStart(event, cell, 'corner')}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeCancel}
                      />
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
          <div className="tip-note panel-description panel-description-tight" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">{helperText}</p>
          </div>
          {exportFrameNote ? (
            <div className="tip-note preview-desktop-note" role="note">
              <span className="tip-note-icon" aria-hidden="true">
                i
              </span>
              <p className="helper-text">{exportFrameNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
