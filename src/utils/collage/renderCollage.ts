import { CollageFitMode, CollageSettings, ImageAsset } from '../../types';

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

function getGridCells(
  imageCount: number,
  region: Cell,
  columns: number,
  gap: number
): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  const safeColumns = clamp(columns, 1, Math.max(1, imageCount));
  const rows = Math.ceil(imageCount / safeColumns);
  const width = (region.width - gap * (safeColumns - 1)) / safeColumns;
  const height = (region.height - gap * (rows - 1)) / rows;

  return Array.from({ length: imageCount }, (_, index) => {
    const column = index % safeColumns;
    const row = Math.floor(index / safeColumns);

    return {
      x: region.x + column * (width + gap),
      y: region.y + row * (height + gap),
      width,
      height
    };
  });
}

function getSquareGridCells(
  imageCount: number,
  region: Cell,
  columns: number,
  gap: number
): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  const safeColumns = clamp(columns, 1, Math.max(1, imageCount));
  const rows = Math.ceil(imageCount / safeColumns);
  const cellSize = Math.min(
    (region.width - gap * (safeColumns - 1)) / safeColumns,
    (region.height - gap * (rows - 1)) / rows
  );
  const gridWidth = cellSize * safeColumns + gap * (safeColumns - 1);
  const gridHeight = cellSize * rows + gap * (rows - 1);
  const offsetX = region.x + (region.width - gridWidth) / 2;
  const offsetY = region.y + (region.height - gridHeight) / 2;

  return Array.from({ length: imageCount }, (_, index) => {
    const column = index % safeColumns;
    const row = Math.floor(index / safeColumns);

    return {
      x: offsetX + column * (cellSize + gap),
      y: offsetY + row * (cellSize + gap),
      width: cellSize,
      height: cellSize
    };
  });
}

function getUniformCells(imageCount: number, outputSize: CanvasSize, settings: CollageSettings): Cell[] {
  return getSquareGridCells(
    imageCount,
    { x: 0, y: 0, width: outputSize.width, height: outputSize.height },
    settings.columns,
    settings.gap
  );
}

function getFeatureTopCells(imageCount: number, outputSize: CanvasSize, gap: number): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  if (imageCount === 1) {
    return [{ x: 0, y: 0, width: outputSize.width, height: outputSize.height }];
  }

  const featureHeight = imageCount <= 3 ? outputSize.height * 0.64 : outputSize.height * 0.56;
  const cells: Cell[] = [{ x: 0, y: 0, width: outputSize.width, height: featureHeight }];
  const remainderRegion = {
    x: 0,
    y: featureHeight + gap,
    width: outputSize.width,
    height: outputSize.height - featureHeight - gap
  };
  const remainingCount = imageCount - 1;
  const columns = remainingCount <= 2 ? remainingCount : 3;

  return [...cells, ...getGridCells(remainingCount, remainderRegion, columns, gap)];
}

function getFeatureLeftCells(imageCount: number, outputSize: CanvasSize, gap: number): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  if (imageCount === 1) {
    return [{ x: 0, y: 0, width: outputSize.width, height: outputSize.height }];
  }

  const cells: Cell[] = [];
  const extraGridNeeded = imageCount > 4;
  const topHeight = extraGridNeeded ? outputSize.height * 0.66 : outputSize.height;
  const featureWidth = outputSize.width * 0.58;
  const supportWidth = outputSize.width - featureWidth - gap;

  cells.push({ x: 0, y: 0, width: featureWidth, height: topHeight });

  const rightStackCount = Math.min(imageCount - 1, imageCount <= 3 ? imageCount - 1 : 3);
  if (rightStackCount > 0) {
    const stackRegion = {
      x: featureWidth + gap,
      y: 0,
      width: supportWidth,
      height: topHeight
    };

    cells.push(...getGridCells(rightStackCount, stackRegion, 1, gap));
  }

  const leftover = imageCount - 1 - rightStackCount;
  if (leftover > 0) {
    const lowerRegion = {
      x: 0,
      y: topHeight + gap,
      width: outputSize.width,
      height: outputSize.height - topHeight - gap
    };
    const lowerColumns = leftover <= 2 ? leftover : 3;
    cells.push(...getGridCells(leftover, lowerRegion, lowerColumns, gap));
  }

  return cells;
}

function getFeatureGridCells(imageCount: number, outputSize: CanvasSize, gap: number): Cell[] {
  if (imageCount <= 0) {
    return [];
  }

  const columns = 3;
  const rows = Math.max(3, Math.ceil((imageCount + 3) / columns));
  const cellSize = Math.min(
    (outputSize.width - gap * (columns - 1)) / columns,
    (outputSize.height - gap * (rows - 1)) / rows
  );
  const gridWidth = cellSize * columns + gap * (columns - 1);
  const gridHeight = cellSize * rows + gap * (rows - 1);
  const offsetX = (outputSize.width - gridWidth) / 2;
  const offsetY = (outputSize.height - gridHeight) / 2;
  const cells: Cell[] = [
    {
      x: offsetX,
      y: offsetY,
      width: cellSize * 2 + gap,
      height: cellSize * 2 + gap
    }
  ];
  const availableSlots: Array<{ column: number; row: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (row < 2 && column < 2) {
        continue;
      }

      availableSlots.push({ column, row });
    }
  }

  for (let index = 1; index < imageCount; index += 1) {
    const slot = availableSlots[index - 1];
    if (!slot) {
      break;
    }

    cells.push({
      x: offsetX + slot.column * (cellSize + gap),
      y: offsetY + slot.row * (cellSize + gap),
      width: cellSize,
      height: cellSize
    });
  }

  return cells;
}

function getCellsForLayout(images: ImageAsset[], settings: CollageSettings, outputSize: CanvasSize): Cell[] {
  if (settings.layoutMode === 'uniform') {
    return getUniformCells(images.length, outputSize, settings);
  }

  switch (settings.featuredStyle) {
    case 'feature-left':
      return getFeatureLeftCells(images.length, outputSize, settings.gap);
    case 'feature-grid':
      return getFeatureGridCells(images.length, outputSize, settings.gap);
    case 'feature-top':
    default:
      return getFeatureTopCells(images.length, outputSize, settings.gap);
  }
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

  const cells = getCellsForLayout(images, settings, outputSize);
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
