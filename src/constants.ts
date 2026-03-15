import { WatermarkSettings } from './types';

export const FONT_OPTIONS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Roboto',
  'Playwrite US Trad'
] as const;

export const DEFAULT_SETTINGS: WatermarkSettings = {
  text: '© Your Name',
  position: 'top-right',
  fontFamily: 'Roboto',
  color: '#ffffff',
  opacity: 1,
  size: 6,
  margin: 1.5,
  bold: false,
  shadow: false,
  showBackground: false
};

export const SETTINGS_STORAGE_KEY = 'photo-watermarker:settings';
export const EXPORT_FORMAT_STORAGE_KEY = 'photo-watermarker:export-format';
export const PRESETS_STORAGE_KEY = 'photo-watermarker:presets';
