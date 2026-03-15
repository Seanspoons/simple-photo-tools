import { WatermarkSettings } from './types';

export const FONT_OPTIONS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Inter'
] as const;

export const DEFAULT_SETTINGS: WatermarkSettings = {
  text: '© Your Name',
  position: 'bottom-right',
  fontFamily: 'Arial',
  color: '#ffffff',
  opacity: 0.75,
  size: 4,
  margin: 3,
  bold: true,
  shadow: true,
  showBackground: false
};

export const SETTINGS_STORAGE_KEY = 'photo-watermarker:settings';
