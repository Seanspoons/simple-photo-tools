import {
  DragEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { MAX_COLLAGE_COLUMNS } from '../../constants';
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
  backgroundColor?: string;
  previewCornerRadius?: number;
  previewImageUrls?: string[];
  isInteractive?: boolean;
  allowTouchMove?: boolean;
  selectedIndex?: number;
  draggedIndex?: number | null;
  dropTargetIndex?: number | null;
  onTileSelect?: (index: number) => void;
  onTileDragStart?: (index: number) => void;
  onTileDragEnter?: (index: number) => void;
  onTileDrop?: (index: number) => void;
  onEmptySlotDrop?: (column: number, row: number) => void;
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
  backgroundColor = '#ffffff',
  previewCornerRadius = 0,
  previewImageUrls = [],
  isInteractive = false,
  allowTouchMove = false,
  selectedIndex = 0,
  draggedIndex = null,
  dropTargetIndex = null,
  onTileSelect,
  onTileDragStart,
  onTileDragEnter,
  onTileDrop,
  onEmptySlotDrop,
  onTileDragEnd,
  onTileResizePreview,
  onTileResizeCommit,
  onTileResizeCancel
}: CollagePreviewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const dragImageRef = useRef<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredEmptySlot, setHoveredEmptySlot] = useState<{ column: number; row: number } | null>(null);
  const [activeResizePreview, setActiveResizePreview] = useState<{
    index: number;
    colSpan: number;
    rowSpan: number;
  } | null>(null);
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
  const touchDragStateRef = useRef<{
    index: number;
    pointerId: number;
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

  const scaledGridGuides = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewMetrics || displaySize.width === 0 || displaySize.height === 0) {
      return [];
    }

    const scaleX = displaySize.width / canvas.width;
    const scaleY = displaySize.height / canvas.height;
    const stepWidth = previewMetrics.cellSize * scaleX;
    const stepHeight = previewMetrics.cellSize * scaleY;
    const scaledGapX = gap * scaleX;
    const scaledGapY = gap * scaleY;
    const offsetX = ((canvas.width - previewMetrics.gridWidth) / 2) * scaleX;
    const offsetY = ((canvas.height - previewMetrics.gridHeight) / 2) * scaleY;
    const guides: Array<{
      column: number;
      row: number;
      x: number;
      y: number;
      width: number;
      height: number;
      borderRadius: number;
    }> = [];

    for (let row = 0; row < previewMetrics.frameRows; row += 1) {
      for (let column = 0; column < previewMetrics.columns; column += 1) {
        guides.push({
          column,
          row,
          x: offsetX + column * (stepWidth + scaledGapX),
          y: offsetY + row * (stepHeight + scaledGapY),
          width: stepWidth,
          height: stepHeight,
          borderRadius: previewCornerRadius * Math.min(scaleX, scaleY)
        });
      }
    }

    return guides;
  }, [canvasRef, displaySize.height, displaySize.width, gap, previewMetrics]);

  const emptyGridGuides = useMemo(() => {
    const occupied = new Set<string>();
    scaledCells.forEach((cell) => {
      for (let rowOffset = 0; rowOffset < cell.rowSpan; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < cell.colSpan; columnOffset += 1) {
          occupied.add(`${cell.column + columnOffset}:${cell.row + rowOffset}`);
        }
      }
    });

    return scaledGridGuides.filter((guide) => !occupied.has(`${guide.column}:${guide.row}`));
  }, [scaledCells, scaledGridGuides]);

  const guideAppearance = useMemo(() => {
    const normalizedColor = backgroundColor.trim().toLowerCase();
    const hex = normalizedColor.startsWith('#') ? normalizedColor.slice(1) : normalizedColor;
    const expandedHex =
      hex.length === 3
        ? hex
            .split('')
            .map((value) => `${value}${value}`)
            .join('')
        : hex;

    if (!/^[0-9a-f]{6}$/i.test(expandedHex)) {
      return {
        guideBorder: 'rgba(31, 59, 45, 0.12)',
        guideFill: 'rgba(255, 255, 255, 0.12)',
        guideShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.38)',
        emptyBorder: 'rgba(217, 162, 77, 0.32)',
        emptyFill: 'rgba(217, 162, 77, 0.06)',
        emptyShadow: 'inset 0 0 0 1px rgba(255, 248, 236, 0.34)',
        emptyHoverBorder: 'rgba(217, 162, 77, 0.82)',
        emptyHoverFill: 'rgba(217, 162, 77, 0.14)',
        emptyHoverShadow: 'inset 0 0 0 1px rgba(255, 248, 236, 0.54)'
      };
    }

    const red = parseInt(expandedHex.slice(0, 2), 16);
    const green = parseInt(expandedHex.slice(2, 4), 16);
    const blue = parseInt(expandedHex.slice(4, 6), 16);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

    return luminance < 0.45
      ? {
          guideBorder: 'rgba(255, 255, 255, 0.72)',
          guideFill: 'rgba(255, 255, 255, 0.14)',
          guideShadow: 'inset 0 0 0 1px rgba(24, 32, 27, 0.18)',
          emptyBorder: 'rgba(255, 243, 214, 0.96)',
          emptyFill: 'rgba(255, 243, 214, 0.24)',
          emptyShadow: 'inset 0 0 0 1px rgba(24, 32, 27, 0.16)',
          emptyHoverBorder: 'rgba(255, 243, 214, 1)',
          emptyHoverFill: 'rgba(255, 243, 214, 0.34)',
          emptyHoverShadow: 'inset 0 0 0 1px rgba(24, 32, 27, 0.2)'
        }
      : {
          guideBorder: 'rgba(31, 59, 45, 0.12)',
          guideFill: 'rgba(255, 255, 255, 0.12)',
          guideShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.38)',
          emptyBorder: 'rgba(217, 162, 77, 0.32)',
          emptyFill: 'rgba(217, 162, 77, 0.06)',
          emptyShadow: 'inset 0 0 0 1px rgba(255, 248, 236, 0.34)',
          emptyHoverBorder: 'rgba(217, 162, 77, 0.82)',
          emptyHoverFill: 'rgba(217, 162, 77, 0.14)',
          emptyHoverShadow: 'inset 0 0 0 1px rgba(255, 248, 236, 0.54)'
        };
  }, [backgroundColor]);

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

    setHoveredEmptySlot(null);
    onTileDragStart?.(index);
  };

  const handleTileDragEnd = () => {
    if (dragImageRef.current) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }

    setHoveredEmptySlot(null);
    onTileDragEnd?.();
  };

  const draggedPreviewRect = useMemo(() => {
    if (draggedIndex === null || !previewMetrics) {
      return null;
    }

    const draggedCell = scaledCells.find((cell) => cell.index === draggedIndex);
    if (!draggedCell) {
      return null;
    }

    const anchor =
      hoveredEmptySlot ??
      scaledCells.find((cell) => cell.index === dropTargetIndex) ??
      null;

    if (!anchor) {
      return null;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const scaleX = displaySize.width / canvas.width;
    const scaleY = displaySize.height / canvas.height;
    const cellWidth = previewMetrics.cellSize * scaleX;
    const cellHeight = previewMetrics.cellSize * scaleY;
    const scaledGapX = gap * scaleX;
    const scaledGapY = gap * scaleY;
    const offsetX = ((canvas.width - previewMetrics.gridWidth) / 2) * scaleX;
    const offsetY = ((canvas.height - previewMetrics.gridHeight) / 2) * scaleY;

    return {
      x: offsetX + anchor.column * (cellWidth + scaledGapX),
      y: offsetY + anchor.row * (cellHeight + scaledGapY),
      width: cellWidth * draggedCell.colSpan + scaledGapX * (draggedCell.colSpan - 1),
      height: cellHeight * draggedCell.rowSpan + scaledGapY * (draggedCell.rowSpan - 1),
      borderRadius: draggedCell.borderRadius
    };
  }, [
    canvasRef,
    displaySize.height,
    displaySize.width,
    draggedIndex,
    dropTargetIndex,
    gap,
    hoveredEmptySlot,
    previewMetrics,
    scaledCells
  ]);

  const handleEmptySlotDrop = (column: number, row: number) => {
    setHoveredEmptySlot(null);
    onEmptySlotDrop?.(column, row);
  };

  const getPointerDropTarget = (clientX: number, clientY: number) => {
    const shellRect = shellRef.current?.getBoundingClientRect();
    if (!shellRect) {
      return null;
    }

    const relativeX = clientX - shellRect.left;
    const relativeY = clientY - shellRect.top;

    const cellTarget = scaledCells.find(
      (cell) =>
        relativeX >= cell.x &&
        relativeX <= cell.x + cell.width &&
        relativeY >= cell.y &&
        relativeY <= cell.y + cell.height
    );

    if (cellTarget) {
      return { type: 'cell' as const, index: cellTarget.index };
    }

    const emptyTarget = emptyGridGuides.find(
      (guide) =>
        relativeX >= guide.x &&
        relativeX <= guide.x + guide.width &&
        relativeY >= guide.y &&
        relativeY <= guide.y + guide.height
    );

    if (emptyTarget) {
      return { type: 'empty' as const, column: emptyTarget.column, row: emptyTarget.row };
    }

    return null;
  };

  const handleTouchDragStart = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    if (!allowTouchMove || event.pointerType === 'mouse') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    touchDragStateRef.current = { index, pointerId: event.pointerId };
    setHoveredEmptySlot(null);
    onTileSelect?.(index);
    onTileDragStart?.(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTouchDragMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const touchState = touchDragStateRef.current;
    if (!touchState || touchState.pointerId !== event.pointerId) {
      return;
    }

    const target = getPointerDropTarget(event.clientX, event.clientY);
    if (!target) {
      setHoveredIndex(null);
      setHoveredEmptySlot(null);
      return;
    }

    if (target.type === 'cell') {
      setHoveredEmptySlot(null);
      setHoveredIndex(target.index);
      onTileDragEnter?.(target.index);
      return;
    }

    setHoveredIndex(null);
    setHoveredEmptySlot({ column: target.column, row: target.row });
  };

  const handleTouchDragEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const touchState = touchDragStateRef.current;
    if (!touchState || touchState.pointerId !== event.pointerId) {
      return;
    }

    const target = getPointerDropTarget(event.clientX, event.clientY);
    if (event.pointerId === touchState.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (target?.type === 'cell') {
      onTileDrop?.(target.index);
    } else if (target?.type === 'empty') {
      handleEmptySlotDrop(target.column, target.row);
    } else {
      onTileDragEnd?.();
    }

    touchDragStateRef.current = null;
    setHoveredIndex(null);
    setHoveredEmptySlot(null);
  };

  const handleTouchDragCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const touchState = touchDragStateRef.current;
    if (!touchState || touchState.pointerId !== event.pointerId) {
      return;
    }

    if (event.pointerId === touchState.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    touchDragStateRef.current = null;
    setHoveredIndex(null);
    setHoveredEmptySlot(null);
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
      maxColSpan: Math.max(1, MAX_COLLAGE_COLUMNS - cell.column)
    };
    setActiveResizePreview({
      index: cell.index,
      colSpan: cell.colSpan,
      rowSpan: cell.rowSpan
    });
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
    setActiveResizePreview({
      index: resizeState.index,
      colSpan: nextColSpan,
      rowSpan: nextRowSpan
    });
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
    setActiveResizePreview(null);
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
    setActiveResizePreview(null);
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
                  {scaledGridGuides.map((guide, index) => (
                    <span
                      key={`guide-${index}`}
                      className="preview-grid-guide"
                      style={{
                        left: `${guide.x}px`,
                        top: `${guide.y}px`,
                        width: `${guide.width}px`,
                        height: `${guide.height}px`,
                        borderRadius: `${guide.borderRadius}px`,
                        borderColor: guideAppearance.guideBorder,
                        background: guideAppearance.guideFill,
                        boxShadow: guideAppearance.guideShadow
                      }}
                    />
                  ))}
                  {draggedIndex !== null
                    ? emptyGridGuides.map((guide) => (
                        <button
                          key={`empty-${guide.column}-${guide.row}`}
                          type="button"
                          className={`preview-empty-dropzone ${
                            hoveredEmptySlot?.column === guide.column &&
                            hoveredEmptySlot?.row === guide.row
                              ? 'is-hovered'
                              : ''
                          }`}
                          style={{
                            left: `${guide.x}px`,
                            top: `${guide.y}px`,
                            width: `${guide.width}px`,
                            height: `${guide.height}px`,
                            borderRadius: `${guide.borderRadius}px`,
                            borderColor:
                              hoveredEmptySlot?.column === guide.column &&
                              hoveredEmptySlot?.row === guide.row
                                ? guideAppearance.emptyHoverBorder
                                : guideAppearance.emptyBorder,
                            background:
                              hoveredEmptySlot?.column === guide.column &&
                              hoveredEmptySlot?.row === guide.row
                                ? guideAppearance.emptyHoverFill
                                : guideAppearance.emptyFill,
                            boxShadow:
                              hoveredEmptySlot?.column === guide.column &&
                              hoveredEmptySlot?.row === guide.row
                                ? guideAppearance.emptyHoverShadow
                                : guideAppearance.emptyShadow
                          }}
                          tabIndex={-1}
                          onDragEnter={() => setHoveredEmptySlot({ column: guide.column, row: guide.row })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleEmptySlotDrop(guide.column, guide.row)}
                        />
                      ))
                    : null}
                  {draggedPreviewRect ? (
                    <span
                      className="preview-drag-footprint"
                      style={{
                        left: `${draggedPreviewRect.x}px`,
                        top: `${draggedPreviewRect.y}px`,
                        width: `${draggedPreviewRect.width}px`,
                        height: `${draggedPreviewRect.height}px`,
                        borderRadius: `${draggedPreviewRect.borderRadius}px`
                      }}
                    />
                  ) : null}
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
                      } ${
                        activeResizePreview?.index === index ? 'is-resize-preview' : ''
                      } ${
                        activeResizePreview && activeResizePreview.index !== index
                          ? 'is-resize-background'
                          : ''
                      }`}
                      style={{
                        left: `${cell.x}px`,
                        top: `${cell.y}px`,
                        width: `${cell.width}px`,
                        height: `${cell.height}px`,
                        borderRadius: `${cell.borderRadius}px`
                      }}
                      draggable={isInteractive && !allowTouchMove}
                      tabIndex={-1}
                      onClick={() => onTileSelect?.(index)}
                      onDragStart={(event) => handleTileDragStart(event, index)}
                      onDragEnter={() => {
                        setHoveredEmptySlot(null);
                        onTileDragEnter?.(index);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onTileDrop?.(index)}
                      onDragEnd={handleTileDragEnd}
                      onPointerDown={(event) => handleTouchDragStart(event, index)}
                      onPointerMove={handleTouchDragMove}
                      onPointerUp={handleTouchDragEnd}
                      onPointerCancel={handleTouchDragCancel}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <span className="preview-dropzone-label">
                        {activeResizePreview?.index === index
                          ? `${activeResizePreview.colSpan} × ${activeResizePreview.rowSpan}`
                          : 'Drag to move'}
                      </span>
                      {!allowTouchMove ? (
                        <>
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
                        </>
                      ) : null}
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
