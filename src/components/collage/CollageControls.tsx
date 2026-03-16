import { CollageSettings } from '../../types';

interface CollageControlsProps {
  settings: CollageSettings;
  disabled?: boolean;
  onChange: <K extends keyof CollageSettings>(key: K, value: CollageSettings[K]) => void;
  onReset: () => void;
}

export function CollageControls({
  settings,
  disabled = false,
  onChange,
  onReset
}: CollageControlsProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Choose the look</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}>
          Reset
        </button>
      </div>

      <div className="controls-grid">
        <label className="field">
          <span>Size</span>
          <select
            value={settings.sizePreset}
            onChange={(event) => onChange('sizePreset', event.target.value as CollageSettings['sizePreset'])}
            disabled={disabled}
          >
            <option value="instagram-square">Instagram Square</option>
            <option value="instagram-portrait">Instagram Portrait</option>
            <option value="story">Story / Vertical</option>
            <option value="high-res-square">High Res Square</option>
          </select>
        </label>

        <label className="field">
          <span>Columns ({settings.columns})</span>
          <input
            type="range"
            min="2"
            max="5"
            step="1"
            value={settings.columns}
            onChange={(event) => onChange('columns', Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Spacing ({settings.gap}px)</span>
          <input
            type="range"
            min="0"
            max="32"
            step="2"
            value={settings.gap}
            onChange={(event) => onChange('gap', Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Background</span>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(event) => onChange('backgroundColor', event.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Photo fit</span>
          <select
            value={settings.fitMode}
            onChange={(event) => onChange('fitMode', event.target.value as CollageSettings['fitMode'])}
            disabled={disabled}
          >
            <option value="cover">Fill the tiles</option>
            <option value="contain">Keep full photo</option>
          </select>
        </label>

        <label className="field">
          <span>Corner rounding ({settings.cornerRadius}px)</span>
          <input
            type="range"
            min="0"
            max="36"
            step="2"
            value={settings.cornerRadius}
            onChange={(event) => onChange('cornerRadius', Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <fieldset className="field field-full layout-choice-group">
          <legend>Main photo size</legend>
          <div className="choice-cards">
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '1x1' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '1x1')}
              disabled={disabled}
            >
              <strong>Normal</strong>
              <span>All photos use the same square size.</span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '2x2' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '2x2')}
              disabled={disabled}
            >
              <strong>Large 2x2</strong>
              <span>Main photo takes the space of 4 square tiles.</span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '2x1' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '2x1')}
              disabled={disabled}
            >
              <strong>Wide 2x1</strong>
              <span>Main photo spans 2 tiles across.</span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '1x2' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '1x2')}
              disabled={disabled}
            >
              <strong>Tall 1x2</strong>
              <span>Main photo spans 2 tiles tall.</span>
            </button>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
