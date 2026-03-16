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
        <fieldset className="field field-full layout-choice-group">
          <legend>Layout mode</legend>
          <div className="choice-cards">
            <button
              type="button"
              className={`choice-card ${settings.layoutMode === 'uniform' ? 'is-active' : ''}`}
              onClick={() => onChange('layoutMode', 'uniform')}
              disabled={disabled}
            >
              <strong>Uniform Grid</strong>
              <span>All photos the same size.</span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.layoutMode === 'featured' ? 'is-active' : ''}`}
              onClick={() => onChange('layoutMode', 'featured')}
              disabled={disabled}
            >
              <strong>Featured Layout</strong>
              <span>One main photo with supporting images around it.</span>
            </button>
          </div>
        </fieldset>

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

        {settings.layoutMode === 'uniform' ? (
          <label className="field">
            <span>Columns ({settings.columns})</span>
            <input
              type="range"
              min="2"
              max="4"
              step="1"
              value={settings.columns}
              onChange={(event) => onChange('columns', Number(event.target.value))}
              disabled={disabled}
            />
          </label>
        ) : null}

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

        {settings.layoutMode === 'featured' ? (
          <fieldset className="field field-full layout-choice-group">
            <legend>Main photo style</legend>
            <div className="choice-cards">
              <button
                type="button"
                className={`choice-card ${settings.featuredStyle === 'feature-top' ? 'is-active' : ''}`}
                onClick={() => onChange('featuredStyle', 'feature-top')}
                disabled={disabled}
              >
                <strong>Top Feature</strong>
                <span>Large photo across the top.</span>
              </button>
              <button
                type="button"
                className={`choice-card ${settings.featuredStyle === 'feature-left' ? 'is-active' : ''}`}
                onClick={() => onChange('featuredStyle', 'feature-left')}
                disabled={disabled}
              >
                <strong>Left Feature</strong>
                <span>Large photo on the left.</span>
              </button>
              <button
                type="button"
                className={`choice-card ${settings.featuredStyle === 'feature-grid' ? 'is-active' : ''}`}
                onClick={() => onChange('featuredStyle', 'feature-grid')}
                disabled={disabled}
              >
                <strong>Large 2x2 Photo</strong>
                <span>Main photo takes the space of 4 smaller tiles.</span>
              </button>
            </div>
          </fieldset>
        ) : null}
      </div>
    </section>
  );
}
