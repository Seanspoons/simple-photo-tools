import { CollageFitMode, CollageFeaturedSpan, CollageSettings, ImageAsset } from '../../types';

interface CanvasSize {
  width: number;
  height: number;
}

interface Cell {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridSlot {
  column: number;
  row: number;
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

function getSpanDimensions(span: CollageFeaturedSpan): { width: number; height: number } {
  switch (span) {
    case '2x2':
      return { width: 2, height: 2 };
    case '2x1':
      return { width: 2, height: 1 };
    case '1x2':
      return { width: 1, height: 2 };
    case '1x1':
    default:
      return { width: 1, height: 1 };
  }
}

function buildGridSlots(
  imageCount: number,
  columns: number,
  featuredSpan: CollageFeaturedSpan
): { slots: GridSlot[]; rows: number } {
  const safeColumns = clamp(columns, 1, Math.max(1, imageCount));
  const span = getSpanDimensions(featuredSpan);
  const useFeatured = imageCount > 0 && span.width <= safeColumns && span.width * span.height > 1;
  const occupied = new Set<string>();
  const slots: GridSlot[] = [];
  let rows = 1;

  if (useFeatured) {
    for (let row = 0; row < span.height; row += 1) {
      for (let column = 0; column < span.width; column += 1) {
        occupied.add(`${column}:${row}`);
      }
    }

    slots.push({ column: 0, row: 0 });
    rows = Math.max(rows, span.height);
  } else if (imageCount > 0) {
    occupied.add('0:0');
    slots.push({ column: 0, row: 0 });
  }

  while (slots.length < imageCount) {
    const row = Math.floor(occupied.size / safeColumns);
    let placed = false;

    for (let currentRow = 0; currentRow <= rows + imageCount; currentRow += 1) {
      for (let currentColumn = 0; currentColumn < safeColumns; currentColumn += 1) {
        const key = `${currentColumn}:${currentRow}`;
        if (occupied.has(key)) {
          continue;
        }

        occupied.add(key);
        slots.push({ column: currentColumn, row: currentRow });
        rows = Math.max(rows, currentRow + 1);
        placed = true;
        break;
      }

      if (placed) {
        break;
      }
    }

    if (!placed) {
      rows = Math.max(rows, row + 1);
    }
  }

  return { slots, rows: Math.max(rows, 1) };
}

function getSquareGridCells(
  imageCount: number,
  outputSize: CanvasSize,
  settings: CollageSettings
): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  const safeColumns = clamp(settings.columns, 1, Math.max(1, imageCount));
  const { slots, rows } = buildGridSlots(imageCount, safeColumns, settings.featuredSpan);
  const cellSize = Math.min(
    (outputSize.width - settings.gap * (safeColumns - 1)) / safeColumns,
    (outputSize.height - settings.gap * (rows - 1)) / rows
  );
  const gridWidth = cellSize * safeColumns + settings.gap * (safeColumns - 1);
  const gridHeight = cellSize * rows + settings.gap * (rows - 1);
  const offsetX = (outputSize.width - gridWidth) / 2;
  const offsetY = (outputSize.height - gridHeight) / 2;
  const span = getSpanDimensions(settings.featuredSpan);

  return slots.map((slot, index) => {
    const useFeatured = index === 0 && span.width <= safeColumns;
    const widthUnits = useFeatured ? span.width : 1;
    const heightUnits = useFeatured ? span.height : 1;

    return {
      x: offsetX + slot.column * (cellSize + settings.gap),
      y: offsetY + slot.row * (cellSize + settings.gap),
      width: cellSize * widthUnits + settings.gap * (widthUnits - 1),
      height: cellSize * heightUnits + settings.gap * (heightUnits - 1)
    };
  });
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

export function getCollageOutputSize(settings: CollageSettings): CanvasSize {
  return getOutputSize(settings);
}

export function renderCollage(
  canvas: HTMLCanvasElement,
  images: ImageAsset[],
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

  const cells = getSquareGridCells(images.length, outputSize, settings);
  cells.forEach((cell, index) => {
    const image = images[index];
    if (!image) {
      return;
    }

    context.save();
    if (settings.cornerRadius > 0) {
      withRoundedClip(context, cell.x, cell.y, cell.width, cell.height, settings.cornerRadius);
    }

    drawImageToRect(
      context,
      image.image,
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      settings.fitMode
    );
    context.restore();
  });
}
