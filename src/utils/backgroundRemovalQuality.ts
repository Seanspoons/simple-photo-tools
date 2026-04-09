import { ImageAsset } from '../types';
import { removeImageBackground } from './backgroundRemoval';

export type BackgroundRemovalMode = 'photo' | 'graphic';

export interface BackgroundRemovalRefinementSettings {
  edgeSoftness: number;
  edgeCleanup: number;
  thresholdBias: number;
}

export interface BackgroundRemovalResult {
  blob: Blob;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('The browser could not prepare the background removal result.');
  }

  return context;
}

function loadBlobImage(blob: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The processed cutout could not be decoded.'));
    };
    image.src = objectUrl;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function extractImageData(image: HTMLImageElement) {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const context = getContext(canvas);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function normalizeAlpha(
  alpha: Uint8ClampedArray,
  thresholdBias: number,
  cleanupStrength: number
) {
  const low = clamp(Math.round(18 + thresholdBias * 80 + cleanupStrength * 14), 4, 110);
  const high = clamp(Math.round(242 - cleanupStrength * 18 + thresholdBias * 10), low + 12, 252);

  for (let index = 0; index < alpha.length; index += 1) {
    const value = alpha[index];
    if (value <= low) {
      alpha[index] = 0;
      continue;
    }

    if (value >= high) {
      alpha[index] = 255;
      continue;
    }

    alpha[index] = Math.round(((value - low) / (high - low)) * 255);
  }
}

function countOpaqueNeighbors(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  cutoff: number
) {
  let total = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
        continue;
      }

      if (alpha[nextY * width + nextX] >= cutoff) {
        total += 1;
      }
    }
  }

  return total;
}

function cleanupAlpha(alpha: Uint8ClampedArray, width: number, height: number, cleanupStrength: number) {
  const passes = cleanupStrength >= 0.2 ? (cleanupStrength >= 0.55 ? 2 : 1) : 0;
  const working = new Uint8ClampedArray(alpha);

  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Uint8ClampedArray(working);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const value = working[index];
        const opaqueNeighbors = countOpaqueNeighbors(working, width, height, x, y, 160);

        if (value >= 170 && opaqueNeighbors <= 1) {
          next[index] = 0;
        } else if (value <= 84 && opaqueNeighbors >= 7) {
          next[index] = 255;
        } else if (value <= 32 && opaqueNeighbors >= 5) {
          next[index] = 180;
        }
      }
    }

    working.set(next);
  }

  alpha.set(working);
}

function blurAlpha(alpha: Uint8ClampedArray, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return;
  }

  const source = new Uint8ClampedArray(alpha);
  const horizontal = new Float32Array(alpha.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;

      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleX = x + offset;
        if (sampleX < 0 || sampleX >= width) {
          continue;
        }

        sum += source[y * width + sampleX];
        count += 1;
      }

      horizontal[y * width + x] = sum / count;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;

      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleY = y + offset;
        if (sampleY < 0 || sampleY >= height) {
          continue;
        }

        sum += horizontal[sampleY * width + x];
        count += 1;
      }

      alpha[y * width + x] = Math.round(sum / count);
    }
  }
}

function estimateBackgroundColor(
  originalPixels: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  width: number,
  height: number
) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  const addPixel = (x: number, y: number) => {
    const pixelIndex = (y * width + x) * 4;
    red += originalPixels[pixelIndex];
    green += originalPixels[pixelIndex + 1];
    blue += originalPixels[pixelIndex + 2];
    samples += 1;
  };

  const borderDepth = Math.max(1, Math.min(18, Math.round(Math.min(width, height) * 0.04)));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder =
        x < borderDepth || y < borderDepth || x >= width - borderDepth || y >= height - borderDepth;
      if (!isBorder) {
        continue;
      }

      const alphaIndex = y * width + x;
      if (alpha[alphaIndex] <= 28) {
        addPixel(x, y);
      }
    }
  }

  if (samples === 0) {
    addPixel(0, 0);
    addPixel(width - 1, 0);
    addPixel(0, height - 1);
    addPixel(width - 1, height - 1);
  }

  return {
    red: red / samples,
    green: green / samples,
    blue: blue / samples
  };
}

function decontaminateEdges(
  originalPixels: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  cleanupStrength: number
) {
  const background = estimateBackgroundColor(originalPixels, alpha, width, height);
  const edgeBoost = 0.55 + cleanupStrength * 0.35;

  for (let index = 0; index < alpha.length; index += 1) {
    const alphaRatio = alpha[index] / 255;
    if (alphaRatio <= 0 || alphaRatio >= 0.985) {
      continue;
    }

    const pixelIndex = index * 4;
    const safeAlpha = Math.max(alphaRatio, 0.12);
    originalPixels[pixelIndex] = clamp(
      Math.round((originalPixels[pixelIndex] - background.red * (1 - safeAlpha) * edgeBoost) / safeAlpha),
      0,
      255
    );
    originalPixels[pixelIndex + 1] = clamp(
      Math.round((originalPixels[pixelIndex + 1] - background.green * (1 - safeAlpha) * edgeBoost) / safeAlpha),
      0,
      255
    );
    originalPixels[pixelIndex + 2] = clamp(
      Math.round((originalPixels[pixelIndex + 2] - background.blue * (1 - safeAlpha) * edgeBoost) / safeAlpha),
      0,
      255
    );
  }
}

async function buildPhotoResult(
  asset: ImageAsset,
  blob: Blob,
  refinement: BackgroundRemovalRefinementSettings
) {
  const cutoutImage = await loadBlobImage(blob);
  const originalData = extractImageData(asset.image);
  const cutoutData = extractImageData(cutoutImage);
  const alpha = new Uint8ClampedArray(cutoutData.data.length / 4);

  for (let index = 0, alphaIndex = 0; index < cutoutData.data.length; index += 4, alphaIndex += 1) {
    alpha[alphaIndex] = cutoutData.data[index + 3];
  }

  normalizeAlpha(alpha, refinement.thresholdBias, refinement.edgeCleanup);
  cleanupAlpha(alpha, originalData.width, originalData.height, refinement.edgeCleanup);

  const blurRadius = refinement.edgeSoftness >= 0.55 ? 2 : refinement.edgeSoftness >= 0.2 ? 1 : 0;
  blurAlpha(alpha, originalData.width, originalData.height, blurRadius);
  decontaminateEdges(
    originalData.data,
    alpha,
    originalData.width,
    originalData.height,
    refinement.edgeCleanup
  );

  for (let index = 0, alphaIndex = 0; index < originalData.data.length; index += 4, alphaIndex += 1) {
    originalData.data[index + 3] = alpha[alphaIndex];
  }

  const canvas = createCanvas(originalData.width, originalData.height);
  const context = getContext(canvas);
  context.putImageData(originalData, 0, 0);

  const exported = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error('The browser could not export the refined cutout.'));
        return;
      }

      resolve(nextBlob);
    }, 'image/png');
  });

  return { blob: exported };
}

export async function processBackgroundRemoval(
  asset: ImageAsset,
  mode: BackgroundRemovalMode,
  refinement: BackgroundRemovalRefinementSettings,
  progress?: (key: string, current: number, total: number) => void
): Promise<BackgroundRemovalResult> {
  const blob = await removeImageBackground(asset.file, progress);

  if (mode === 'graphic') {
    return { blob };
  }

  return buildPhotoResult(asset, blob, refinement);
}
