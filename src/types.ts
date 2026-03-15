export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type ExportFormat = 'jpeg' | 'png';

export interface WatermarkSettings {
  text: string;
  position: WatermarkPosition;
  fontFamily: string;
  color: string;
  opacity: number;
  size: number;
  margin: number;
  bold: boolean;
  shadow: boolean;
  showBackground: boolean;
}

export interface ImageAsset {
  file: File;
  objectUrl: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  name: string;
  mimeType: string;
  wasConverted: boolean;
}

export interface RenderWatermarkOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  width: number;
  height: number;
  settings: WatermarkSettings;
}
