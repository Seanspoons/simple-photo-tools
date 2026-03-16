import { CollageSavedPreset, CollageSettings } from '../../types';

const SIZE_OPTIONS: Array<{
  value: CollageSettings['sizePreset'];
  label: string;
  description: string;
  previewClassName: string;
}> = [
  {
    value: 'instagram-square',
    label: 'Square',
    description: '1080 × 1080',
    previewClassName: 'output-preview-square'
  },
  {
    value: 'instagram-portrait',
    label: 'Portrait',
    description: '1080 × 1350',
    previewClassName: 'output-preview-portrait'
  },
  {
    value: 'story',
    label: 'Story',
    description: '1080 × 1920',
    previewClassName: 'output-preview-story'
  },
  {
    value: 'high-res-square',
    label: 'High Res',
    description: '2160 × 2160',
    previewClassName: 'output-preview-square'
  }
];

interface CollageControlsProps {
  settings: CollageSettings;
  presetName: string;
  savedPresets: CollageSavedPreset[];
  usesBalancedLayout: boolean;
  layoutWarning: string | null;
  warningActions: Array<{ label: string; onClick: () => void }>;
  disabled?: boolean;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onApplyPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onAutoArrange: () => void;
  onChange: <K extends keyof CollageSettings>(key: K, value: CollageSettings[K]) => void;
  onReset: () => void;
}

export function CollageControls({
  settings,
  presetName,
  savedPresets,
  usesBalancedLayout,
  layoutWarning,
  warningActions,
  disabled = false,
  onPresetNameChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onAutoArrange,
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
        <div className="panel-heading-actions">
          <button type="button" className="ghost-button" onClick={onAutoArrange} disabled={disabled}>
            Auto arrange
          </button>
          <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}>
            Reset
          </button>
        </div>
      </div>

      <div className="controls-grid">
        <div className="field field-full preset-panel">
          <span>Saved collage looks</span>
          <div className="preset-save-row">
            <input
              type="text"
              value={presetName}
              onChange={(event) => onPresetNameChange(event.target.value)}
              disabled={disabled}
              placeholder="Name this collage look"
            />
            <button type="button" className="secondary-button" onClick={onSavePreset} disabled={disabled}>
              Save look
            </button>
          </div>
          <div className="preset-list" aria-label="Saved collage looks">
            {savedPresets.length > 0 ? (
              savedPresets.map((preset) => (
                <div key={preset.id} className="preset-chip">
                  <button
                    type="button"
                    className="ghost-button preset-apply-button"
                    onClick={() => onApplyPreset(preset.id)}
                    disabled={disabled}
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    className="preset-delete-button"
                    onClick={() => onDeletePreset(preset.id)}
                    disabled={disabled}
                    aria-label={`Delete collage look ${preset.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="helper-text">No saved collage looks yet.</p>
            )}
          </div>
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              Each saved look keeps your collage size, spacing, background, and main photo size.
            </p>
          </div>
        </div>

        <div className="field field-full collage-summary">
          <span>Quick summary</span>
          <p className="helper-text">
            {usesBalancedLayout
              ? 'A balanced layout'
              : `${settings.columns} columns with ${settings.gap}px spacing`}{' '}
            keeps {settings.fitMode === 'cover' ? 'photos filled edge to edge' : 'full photos visible'}
            , with{' '}
            {settings.featuredSpan === '1x1'
              ? usesBalancedLayout
                ? 'more natural shapes for smaller photo sets.'
                : 'all photos the same size.'
              : settings.featuredSpan === '2x2'
                ? 'one large 2x2 main photo.'
                : settings.featuredSpan === '2x1'
                  ? 'one wide main photo.'
                  : 'one tall main photo.'}
          </p>
        </div>

        {layoutWarning ? (
          <div className="field field-full collage-warning" role="status">
            <span>Heads up</span>
            <p className="helper-text">{layoutWarning}</p>
            {warningActions.length > 0 ? (
              <div className="warning-actions">
                {warningActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="ghost-button warning-action-button"
                    onClick={action.onClick}
                    disabled={disabled}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <fieldset className="field field-full layout-choice-group">
          <legend>Output size</legend>
          <div className="output-choice-grid">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`output-choice-card ${
                  settings.sizePreset === option.value ? 'is-active' : ''
                }`}
                onClick={() => onChange('sizePreset', option.value)}
                disabled={disabled}
              >
                <span className={`output-preview ${option.previewClassName}`} aria-hidden="true" />
                <span className="choice-card-copy">
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {usesBalancedLayout ? (
          <div className="field">
            <span>Layout</span>
            <p className="helper-text">
              For 2 to 4 photos, the app uses a balanced layout automatically.
            </p>
          </div>
        ) : (
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
        )}

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
          <legend>Layout style</legend>
          <div className="choice-cards">
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '1x1' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '1x1')}
              disabled={disabled}
            >
              <span className="layout-preview layout-preview-grid" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="choice-card-copy">
                <strong>Normal</strong>
                <span>All photos use the same square size.</span>
              </span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '2x2' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '2x2')}
              disabled={disabled}
            >
              <span className="layout-preview layout-preview-2x2" aria-hidden="true">
                <span className="is-main" />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="choice-card-copy">
                <strong>Large 2x2</strong>
                <span>Main photo takes the space of 4 square tiles.</span>
              </span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '2x1' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '2x1')}
              disabled={disabled}
            >
              <span className="layout-preview layout-preview-2x1" aria-hidden="true">
                <span className="is-main" />
                <span />
                <span />
                <span />
              </span>
              <span className="choice-card-copy">
                <strong>Wide 2x1</strong>
                <span>Main photo spans 2 tiles across.</span>
              </span>
            </button>
            <button
              type="button"
              className={`choice-card ${settings.featuredSpan === '1x2' ? 'is-active' : ''}`}
              onClick={() => onChange('featuredSpan', '1x2')}
              disabled={disabled}
            >
              <span className="layout-preview layout-preview-1x2" aria-hidden="true">
                <span className="is-main" />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="choice-card-copy">
                <strong>Tall 1x2</strong>
                <span>Main photo spans 2 tiles tall.</span>
              </span>
            </button>
          </div>
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              The first photo becomes the main photo whenever you choose a larger layout.
            </p>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
