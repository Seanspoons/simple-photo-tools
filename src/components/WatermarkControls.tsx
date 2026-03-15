import { ChangeEvent } from 'react';
import { FONT_OPTIONS } from '../constants';
import { ExportFormat, WatermarkSettings, WatermarkPosition } from '../types';

interface WatermarkControlsProps {
  settings: WatermarkSettings;
  exportFormat: ExportFormat;
  beforeAfterMode: 'after' | 'before';
  disabled?: boolean;
  onSettingChange: <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => void;
  onExportFormatChange: (format: ExportFormat) => void;
  onBeforeAfterChange: (mode: 'after' | 'before') => void;
  onReset: () => void;
}

const POSITION_OPTIONS: Array<{ label: string; value: WatermarkPosition }> = [
  { label: 'Top left', value: 'top-left' },
  { label: 'Top right', value: 'top-right' },
  { label: 'Bottom left', value: 'bottom-left' },
  { label: 'Bottom right', value: 'bottom-right' }
];

function parseRangeValue(event: ChangeEvent<HTMLInputElement>): number {
  return Number(event.target.value);
}

export function WatermarkControls({
  settings,
  exportFormat,
  beforeAfterMode,
  disabled = false,
  onSettingChange,
  onExportFormatChange,
  onBeforeAfterChange,
  onReset
}: WatermarkControlsProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>Watermark settings</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}>
          Reset defaults
        </button>
      </div>

      <div className="controls-grid">
        <label className="field field-full">
          <span>Watermark Text</span>
          <input
            type="text"
            value={settings.text}
            onChange={(event) => onSettingChange('text', event.target.value)}
            disabled={disabled}
            placeholder="© Your Name"
          />
        </label>

        <label className="field">
          <span>Position</span>
          <select
            value={settings.position}
            onChange={(event) => onSettingChange('position', event.target.value as WatermarkPosition)}
            disabled={disabled}
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Font</span>
          <select
            value={settings.fontFamily}
            onChange={(event) => onSettingChange('fontFamily', event.target.value)}
            disabled={disabled}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Color</span>
          <input
            type="color"
            value={settings.color}
            onChange={(event) => onSettingChange('color', event.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Opacity ({Math.round(settings.opacity * 100)}%)</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={settings.opacity}
            onChange={(event) => onSettingChange('opacity', parseRangeValue(event))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Size ({settings.size}%)</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={settings.size}
            onChange={(event) => onSettingChange('size', parseRangeValue(event))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Margin ({settings.margin}%)</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={settings.margin}
            onChange={(event) => onSettingChange('margin', parseRangeValue(event))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Export format</span>
          <select
            value={exportFormat}
            onChange={(event) => onExportFormatChange(event.target.value as ExportFormat)}
            disabled={disabled}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
          </select>
        </label>

        <fieldset className="toggle-row field-full">
          <legend>Options</legend>
          <label className="check-field">
            <input
              type="checkbox"
              checked={settings.bold}
              onChange={(event) => onSettingChange('bold', event.target.checked)}
              disabled={disabled}
            />
            <span>Bold text</span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={settings.shadow}
              onChange={(event) => onSettingChange('shadow', event.target.checked)}
              disabled={disabled}
            />
            <span>Shadow</span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={settings.showBackground}
              onChange={(event) => onSettingChange('showBackground', event.target.checked)}
              disabled={disabled}
            />
            <span>Background pill</span>
          </label>
        </fieldset>

        <fieldset className="toggle-row field-full">
          <legend>Preview mode</legend>
          <label className="check-field">
            <input
              type="radio"
              name="preview-mode"
              checked={beforeAfterMode === 'after'}
              onChange={() => onBeforeAfterChange('after')}
              disabled={disabled}
            />
            <span>After</span>
          </label>
          <label className="check-field">
            <input
              type="radio"
              name="preview-mode"
              checked={beforeAfterMode === 'before'}
              onChange={() => onBeforeAfterChange('before')}
              disabled={disabled}
            />
            <span>Before</span>
          </label>
        </fieldset>
      </div>
    </section>
  );
}
