export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type ExportFormat = 'jpeg' | 'png';
export type CollageFitMode = 'cover' | 'contain';
export type CollageSizePreset =
  | 'instagram-square'
  | 'instagram-portrait'
  | 'story'
  | 'high-res-square';
export type CollageFeaturedSpan = '1x1' | '2x1' | '1x2' | '2x2';

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

export interface SavedPreset {
  id: string;
  name: string;
  settings: WatermarkSettings;
  exportFormat: ExportFormat;
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

export interface CollageSettings {
  sizePreset: CollageSizePreset;
  columns: number;
  gap: number;
  backgroundColor: string;
  fitMode: CollageFitMode;
  cornerRadius: number;
  exportFormat: ExportFormat;
  featuredSpan: CollageFeaturedSpan;
}
