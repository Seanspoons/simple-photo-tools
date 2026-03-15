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
    case 'top-right':
      return {
        x: canvasWidth - margin - textWidth,
        y: margin,
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
  const fontFamily = settings.fontFamily === 'Inter' ? '"Inter", "Segoe UI", sans-serif' : settings.fontFamily;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = 'left';
  context.textBaseline = 'top';

  const metrics = context.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const textWidth = metrics.width;
  const textHeight = ascent + descent;
  const margin = getMargin(width, height, settings);
  const { x, y } = getTextCoordinates(
    settings.position,
    width,
    height,
    margin,
    textWidth,
    textHeight
  );

  context.save();
  context.globalAlpha = clamp(settings.opacity, 0.05, 1);

  if (settings.showBackground) {
    const paddingX = Math.round(fontSize * 0.35);
    const paddingY = Math.round(fontSize * 0.2);
    const radius = Math.round(fontSize * 0.35);
    const boxX = x - paddingX;
    const boxY = y - paddingY;
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
  context.fillText(text, x, y);
  context.restore();
}
