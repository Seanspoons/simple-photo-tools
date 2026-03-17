import { CollageFitMode, CollageSettings, CollageTile } from '../../types';

interface CanvasSize {
  width: number;
  height: number;
}

export interface CollageLayoutCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollagePackedTile extends CollageLayoutCell {
  id: string;
  index: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface CollageRenderedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollageLayoutMetrics {
  outputWidth: number;
  outputHeight: number;
  columns: number;
  rows: number;
  frameRows: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
}

export interface CollageLayoutFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PackedTilePlacement {
  id: string;
  index: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

const COLLAGE_SIZES: Record<CollageSettings['sizePreset'], CanvasSize> = {
  'instagram-square': { width: 1080, height: 1080 },
  'instagram-portrait': { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  'high-res-square': { width: 2160, height: 2160 }
};

function getOutputSize(settings: CollageSettings): CanvasSize {
  return COLLAGE_SIZES[settings.sizePreset];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSpan(value: number, max: number) {
  return clamp(Math.round(value), 1, Math.max(1, max));
}

function canFitAt(
  occupancy: boolean[][],
  column: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  columns: number
) {
  if (column + colSpan > columns) {
    return false;
  }

  for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
      if (occupancy[row + rowOffset]?.[column + columnOffset]) {
        return false;
      }
    }
  }

  return true;
}

function markOccupied(
  occupancy: boolean[][],
  column: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  columns: number
) {
  for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
    const targetRow = row + rowOffset;
    if (!occupancy[targetRow]) {
      occupancy[targetRow] = Array.from({ length: columns }, () => false);
    }

    for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
      occupancy[targetRow][column + columnOffset] = true;
    }
  }
}

function packTiles(tiles: CollageTile[], columns: number): { placements: PackedTilePlacement[]; rows: number } {
  const safeColumns = clamp(columns, 1, Math.max(1, columns));
  const occupancy: boolean[][] = [];
  const placements: PackedTilePlacement[] = [];
  let maxRow = 0;

  tiles.forEach((tile, index) => {
    const colSpan = normalizeSpan(tile.colSpan, safeColumns);
    const rowSpan = normalizeSpan(tile.rowSpan, 4);
    let row = 0;
    let placed = false;

    while (!placed) {
      for (let column = 0; column <= safeColumns - colSpan; column += 1) {
        if (!canFitAt(occupancy, column, row, colSpan, rowSpan, safeColumns)) {
          continue;
        }

        markOccupied(occupancy, column, row, colSpan, rowSpan, safeColumns);
        placements.push({
          id: tile.id,
          index,
          column,
          row,
          colSpan,
          rowSpan
        });
        maxRow = Math.max(maxRow, row + rowSpan);
        placed = true;
        break;
      }

      row += 1;
    }
  });

  return {
    placements,
    rows: Math.max(maxRow, 1)
  };
}

function getTileArea(tiles: CollageTile[]) {
  return tiles.reduce(
    (total, tile) => total + normalizeSpan(tile.colSpan, 6) * normalizeSpan(tile.rowSpan, 6),
    0
  );
}

function chooseColumnCount(tiles: CollageTile[], settings: CollageSettings, outputSize: CanvasSize) {
  const preferredColumns = clamp(settings.columns, 2, 6);
  const totalArea = getTileArea(tiles);
  const targetAspect = outputSize.width / outputSize.height;
  const idealColumns = Math.max(2, Math.round(Math.sqrt(totalArea * targetAspect)));
  const candidateMax = clamp(Math.max(preferredColumns + 2, idealColumns + 1), 2, 6);
  let bestColumns = preferredColumns;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let candidateColumns = 2; candidateColumns <= candidateMax; candidateColumns += 1) {
    const { rows } = packTiles(tiles, candidateColumns);
    const gridAspect = candidateColumns / rows;
    const emptyCells = candidateColumns * rows - totalArea;
    const growthPenalty = candidateColumns > preferredColumns ? (candidateColumns - preferredColumns) * 0.18 : 0;
    const score =
      Math.abs(gridAspect - targetAspect) * 6 +
      emptyCells * 0.35 +
      growthPenalty;

    if (score < bestScore) {
      bestColumns = candidateColumns;
      bestScore = score;
    }
  }

  return bestColumns;
}

function chooseFrameRows(columns: number, packedRows: number, outputSize: CanvasSize) {
  const targetAspect = outputSize.width / outputSize.height;
  const idealRows = Math.max(1, Math.round(columns / targetAspect));
  return Math.max(packedRows, idealRows);
}

function getPackedTiles(
  tiles: CollageTile[],
  outputSize: CanvasSize,
  settings: CollageSettings
): { tiles: CollagePackedTile[]; metrics: CollageLayoutMetrics } {
  if (tiles.length === 0) {
    return {
      tiles: [],
      metrics: {
        outputWidth: outputSize.width,
        outputHeight: outputSize.height,
        columns: settings.columns,
        rows: 0,
        frameRows: 0,
        cellSize: 0,
        gridWidth: 0,
        gridHeight: 0
      }
    };
  }

  const safeColumns = chooseColumnCount(tiles, settings, outputSize);
  const { placements, rows } = packTiles(tiles, safeColumns);
  const frameRows = chooseFrameRows(safeColumns, rows, outputSize);
  const cellSize = Math.min(
    (outputSize.width - settings.gap * (safeColumns - 1)) / safeColumns,
    (outputSize.height - settings.gap * (frameRows - 1)) / frameRows
  );
  const gridWidth = cellSize * safeColumns + settings.gap * (safeColumns - 1);
  const gridHeight = cellSize * frameRows + settings.gap * (frameRows - 1);
  const offsetX = (outputSize.width - gridWidth) / 2;
  const offsetY = (outputSize.height - gridHeight) / 2;

  return {
    tiles: placements.map((placement) => ({
      id: placement.id,
      index: placement.index,
      column: placement.column,
      row: placement.row,
      colSpan: placement.colSpan,
      rowSpan: placement.rowSpan,
      x: offsetX + placement.column * (cellSize + settings.gap),
      y: offsetY + placement.row * (cellSize + settings.gap),
      width: cellSize * placement.colSpan + settings.gap * (placement.colSpan - 1),
      height: cellSize * placement.rowSpan + settings.gap * (placement.rowSpan - 1)
    })),
    metrics: {
      outputWidth: outputSize.width,
      outputHeight: outputSize.height,
      columns: safeColumns,
      rows,
      frameRows,
      cellSize,
      gridWidth,
      gridHeight
    }
  };
}

function withRoundedClip(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();
}

function drawImageToRect(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fitMode: CollageFitMode
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let offsetX = x;
  let offsetY = y;

  if (fitMode === 'cover') {
    if (imageRatio > rectRatio) {
      drawWidth = height * imageRatio;
      offsetX = x - (drawWidth - width) / 2;
    } else {
      drawHeight = width / imageRatio;
      offsetY = y - (drawHeight - height) / 2;
    }
  } else if (imageRatio > rectRatio) {
    drawHeight = width / imageRatio;
    offsetY = y + (height - drawHeight) / 2;
  } else {
    drawWidth = height * imageRatio;
    offsetX = x + (width - drawWidth) / 2;
  }

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

export function getRenderedImageRect(
  cell: CollageLayoutCell,
  imageWidth: number,
  imageHeight: number,
  fitMode: CollageFitMode
): CollageRenderedRect {
  const imageRatio = imageWidth / imageHeight;
  const rectRatio = cell.width / cell.height;

  let drawWidth = cell.width;
  let drawHeight = cell.height;
  let offsetX = cell.x;
  let offsetY = cell.y;

  if (fitMode === 'cover') {
    return {
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height
    };
  }

  if (imageRatio > rectRatio) {
    drawHeight = cell.width / imageRatio;
    offsetY = cell.y + (cell.height - drawHeight) / 2;
  } else {
    drawWidth = cell.height * imageRatio;
    offsetX = cell.x + (cell.width - drawWidth) / 2;
  }

  return {
    x: offsetX,
    y: offsetY,
    width: drawWidth,
    height: drawHeight
  };
}

export function getCollageOutputSize(settings: CollageSettings): CanvasSize {
  return getOutputSize(settings);
}

export function getCollageLayoutMetrics(
  tiles: CollageTile[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
): CollageLayoutMetrics {
  const outputSize = sizeOverride ?? getOutputSize(settings);
  return getPackedTiles(tiles, outputSize, settings).metrics;
}

export function getCollageLayoutCells(
  tiles: CollageTile[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
): CollageLayoutCell[] {
  const outputSize = sizeOverride ?? getOutputSize(settings);
  return getPackedTiles(tiles, outputSize, settings).tiles;
}

export function getCollagePackedTiles(
  tiles: CollageTile[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
): CollagePackedTile[] {
  const outputSize = sizeOverride ?? getOutputSize(settings);
  return getPackedTiles(tiles, outputSize, settings).tiles;
}

export function getCollageLayoutFrame(
  tiles: CollageTile[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
): CollageLayoutFrame {
  const outputSize = sizeOverride ?? getOutputSize(settings);
  const packedTiles = getPackedTiles(tiles, outputSize, settings).tiles;
  if (packedTiles.length === 0) {
    return {
      x: 0,
      y: 0,
      width: outputSize.width,
      height: outputSize.height
    };
  }

  const minX = Math.min(...packedTiles.map((tile) => tile.x));
  const minY = Math.min(...packedTiles.map((tile) => tile.y));
  const maxX = Math.max(...packedTiles.map((tile) => tile.x + tile.width));
  const maxY = Math.max(...packedTiles.map((tile) => tile.y + tile.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function renderCollage(
  canvas: HTMLCanvasElement,
  tiles: CollageTile[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
) {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.');
  }

  const outputSize = sizeOverride ?? getOutputSize(settings);
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  context.clearRect(0, 0, outputSize.width, outputSize.height);
  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, outputSize.width, outputSize.height);

  const { tiles: packedTiles } = getPackedTiles(tiles, outputSize, settings);
  packedTiles.forEach((packedTile) => {
    const tile = tiles[packedTile.index];
    if (!tile) {
      return;
    }

    context.save();
    if (settings.cornerRadius > 0) {
      withRoundedClip(
        context,
        packedTile.x,
        packedTile.y,
        packedTile.width,
        packedTile.height,
        settings.cornerRadius
      );
    }

    drawImageToRect(
      context,
      tile.image,
      packedTile.x,
      packedTile.y,
      packedTile.width,
      packedTile.height,
      settings.fitMode
    );
    context.restore();
  });
}
