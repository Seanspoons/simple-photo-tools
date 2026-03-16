import { CollageFitMode, CollageSettings, ImageAsset } from '../../types';

interface CanvasSize {
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

function getUniformGrid(
  imageCount: number,
  canvasWidth: number,
  canvasHeight: number,
  columns: number,
  gap: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const rows = Math.ceil(imageCount / columns);
  const tileWidth = (canvasWidth - gap * (columns - 1)) / columns;
  const tileHeight = (canvasHeight - gap * (rows - 1)) / rows;

  return Array.from({ length: imageCount }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    return {
      x: column * (tileWidth + gap),
      y: row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight
    };
  });
}

function getFeatureTopGrid(
  imageCount: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): Array<{ x: number; y: number; width: number; height: number }> {
  if (imageCount === 0) {
    return [];
  }

  const featuredHeight = canvasHeight * 0.56;
  const cells = [{ x: 0, y: 0, width: canvasWidth, height: featuredHeight }];
  const remaining = imageCount - 1;
  if (remaining <= 0) {
    return cells;
  }

  const columns = remaining <= 2 ? remaining : 3;
  const rows = Math.ceil(remaining / columns);
  const gridY = featuredHeight + gap;
  const gridHeight = canvasHeight - gridY;
  const tileWidth = (canvasWidth - gap * (columns - 1)) / columns;
  const tileHeight = (gridHeight - gap * (rows - 1)) / rows;

  for (let index = 0; index < remaining; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    cells.push({
      x: column * (tileWidth + gap),
      y: gridY + row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight
    });
  }

  return cells;
}

function getFeatureLeftGrid(
  imageCount: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): Array<{ x: number; y: number; width: number; height: number }> {
  if (imageCount === 0) {
    return [];
  }

  const featureWidth = canvasWidth * 0.58;
  const rightWidth = canvasWidth - featureWidth - gap;
  const cells = [{ x: 0, y: 0, width: featureWidth, height: canvasHeight }];
  const remaining = imageCount - 1;

  if (remaining <= 0) {
    return cells;
  }

  const rows = Math.min(3, remaining);
  const stackedHeight = (canvasHeight - gap * (rows - 1)) / rows;

  for (let index = 0; index < Math.min(remaining, 3); index += 1) {
    cells.push({
      x: featureWidth + gap,
      y: index * (stackedHeight + gap),
      width: rightWidth,
      height: stackedHeight
    });
  }

  const leftover = remaining - 3;
  if (leftover > 0) {
    const extraRows = Math.ceil(leftover / 3);
    const totalHeight = canvasHeight * 0.46;
    const extraTileHeight = (totalHeight - gap * (extraRows - 1)) / extraRows;
    const extraTileWidth = (canvasWidth - gap * 2) / 3;
    const startY = canvasHeight - totalHeight;

    for (let index = 0; index < leftover; index += 1) {
      const column = index % 3;
      const row = Math.floor(index / 3);
      cells.push({
        x: column * (extraTileWidth + gap),
        y: startY + row * (extraTileHeight + gap),
        width: extraTileWidth,
        height: extraTileHeight
      });
    }
  }

  return cells;
}

function getFeatureGrid(
  imageCount: number,
  canvasWidth: number,
  canvasHeight: number,
  gap: number
): Array<{ x: number; y: number; width: number; height: number }> {
  if (imageCount === 0) {
    return [];
  }

  const columns = 3;
  const rows = Math.max(3, Math.ceil((imageCount + 3) / columns));
  const tileWidth = (canvasWidth - gap * (columns - 1)) / columns;
  const tileHeight = (canvasHeight - gap * (rows - 1)) / rows;
  const cells = [{ x: 0, y: 0, width: tileWidth * 2 + gap, height: tileHeight * 2 + gap }];
  const slots: Array<{ column: number; row: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (row < 2 && column < 2) {
        continue;
      }

      slots.push({ column, row });
    }
  }

  for (let index = 1; index < imageCount; index += 1) {
    const slot = slots[index - 1];
    if (!slot) {
      continue;
    }

    cells.push({
      x: slot.column * (tileWidth + gap),
      y: slot.row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight
    });
  }

  return cells;
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

export function renderUniformCollage(
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

  const columns = Math.min(settings.columns, Math.max(1, images.length));
  const cells = getUniformGrid(
    images.length,
    outputSize.width,
    outputSize.height,
    columns,
    settings.gap
  );

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

function getFeaturedCells(
  images: ImageAsset[],
  settings: CollageSettings,
  outputSize: CanvasSize
) {
  switch (settings.featuredStyle) {
    case 'feature-left':
      return getFeatureLeftGrid(images.length, outputSize.width, outputSize.height, settings.gap);
    case 'feature-grid':
      return getFeatureGrid(images.length, outputSize.width, outputSize.height, settings.gap);
    case 'feature-top':
    default:
      return getFeatureTopGrid(images.length, outputSize.width, outputSize.height, settings.gap);
  }
}

export function renderCollage(
  canvas: HTMLCanvasElement,
  images: ImageAsset[],
  settings: CollageSettings,
  sizeOverride?: CanvasSize
) {
  if (settings.layoutMode === 'uniform') {
    renderUniformCollage(canvas, images, settings, sizeOverride);
    return;
  }

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

  const cells = getFeaturedCells(images, settings, outputSize);
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
