import { RenderWatermarkOptions, WatermarkPosition, WatermarkSettings } from '../types';

const MIN_FONT_SIZE = 14;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getFontSize(width: number, height: number, settings: WatermarkSettings): number {
  const shorterEdge = Math.min(width, height);
  const scaledSize = (shorterEdge * settings.size) / 100;
  return clamp(Math.round(scaledSize), MIN_FONT_SIZE, Math.round(shorterEdge * 0.2));
}

function getMargin(width: number, height: number, settings: WatermarkSettings): number {
  const shorterEdge = Math.min(width, height);
  return Math.round((shorterEdge * settings.margin) / 100);
}

function getTextCoordinates(
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  margin: number,
  textWidth: number,
  textHeight: number
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin, align: 'left', baseline: 'top' };
    case 'top-center':
      return {
        x: (canvasWidth - textWidth) / 2,
        y: margin,
        align: 'left',
        baseline: 'top'
      };
    case 'top-right':
      return {
        x: canvasWidth - margin - textWidth,
        y: margin,
        align: 'left',
        baseline: 'top'
      };
    case 'center-left':
      return {
        x: margin,
        y: (canvasHeight - textHeight) / 2,
        align: 'left',
        baseline: 'top'
      };
    case 'center':
      return {
        x: (canvasWidth - textWidth) / 2,
        y: (canvasHeight - textHeight) / 2,
        align: 'left',
        baseline: 'top'
      };
    case 'center-right':
      return {
        x: canvasWidth - margin - textWidth,
        y: (canvasHeight - textHeight) / 2,
        align: 'left',
        baseline: 'top'
      };
    case 'bottom-left':
      return {
        x: margin,
        y: canvasHeight - margin - textHeight,
        align: 'left',
        baseline: 'top'
      };
    case 'bottom-center':
      return {
        x: (canvasWidth - textWidth) / 2,
        y: canvasHeight - margin - textHeight,
        align: 'left',
        baseline: 'top'
      };
    case 'bottom-right':
      return {
        x: canvasWidth - margin - textWidth,
        y: canvasHeight - margin - textHeight,
        align: 'left',
        baseline: 'top'
      };
  }
}

export function renderWatermarkedImage({
  canvas,
  image,
  width,
  height,
  settings
}: RenderWatermarkOptions): void {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.');
  }

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const text = settings.text.trim();
  if (!text) {
    return;
  }

  const fontSize = getFontSize(width, height, settings);
  const fontWeight = settings.bold ? '700' : '400';
  const fontFamily =
    settings.fontFamily === 'Roboto'
      ? '"Roboto", "Segoe UI", Arial, sans-serif'
      : settings.fontFamily === 'Playwrite US Trad'
        ? '"Playwrite US Trad", cursive'
        : settings.fontFamily;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  const metrics = context.measureText(text);
  const left = metrics.actualBoundingBoxLeft || 0;
  const right = metrics.actualBoundingBoxRight || metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const textWidth = left + right;
  const textHeight = ascent + descent;
  const margin = getMargin(width, height, settings);
  const { x: textBoxX, y: textBoxY } = getTextCoordinates(
    settings.position,
    width,
    height,
    margin,
    textWidth,
    textHeight
  );
  const textX = textBoxX + left;
  const textY = textBoxY + ascent;

  context.save();
  context.globalAlpha = clamp(settings.opacity, 0.05, 1);

  if (settings.showBackground) {
    const paddingX = Math.round(fontSize * 0.35);
    const paddingY = Math.round(fontSize * 0.2);
    const radius = Math.round(fontSize * 0.35);
    const boxX = textBoxX - paddingX;
    const boxY = textBoxY - paddingY;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = textHeight + paddingY * 2;

    context.fillStyle = 'rgba(0, 0, 0, 0.28)';
    context.beginPath();
    context.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    context.fill();
  }

  if (settings.shadow) {
    context.shadowColor = 'rgba(0, 0, 0, 0.45)';
    context.shadowBlur = Math.max(4, fontSize * 0.25);
    context.shadowOffsetX = Math.max(1, Math.round(fontSize * 0.08));
    context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.08));
  }

  context.fillStyle = settings.color;
  context.fillText(text, textX, textY);
  context.restore();
}
