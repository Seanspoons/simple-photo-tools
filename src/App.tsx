import { useEffect, useState } from 'react';
import { CollageMaker } from './components/collage/CollageMaker';
import { WatermarkTool } from './components/watermark/WatermarkTool';
import { ACTIVE_TOOL_STORAGE_KEY } from './constants';

type ToolKey = 'watermark' | 'collage';

function loadStoredTool(): ToolKey {
  if (typeof window === 'undefined') {
    return 'watermark';
  }

  return window.localStorage.getItem(ACTIVE_TOOL_STORAGE_KEY) === 'collage'
    ? 'collage'
    : 'watermark';
}

export default function App() {
  const logoUrl = `${import.meta.env.BASE_URL}icon.svg`;
  const [activeTool, setActiveTool] = useState<ToolKey>(loadStoredTool);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TOOL_STORAGE_KEY, activeTool);
  }, [activeTool]);

  return (
    <div className="app-shell">
      <main className="app">
        <section className="site-intro panel">
          <div className="site-intro-copy">
            <div className="brand-mark" aria-hidden="true">
              <img src={logoUrl} alt="" />
            </div>
            <div>
              <p className="eyebrow">Photo Watermarker</p>
              <h1>Simple photo tools that stay on your device.</h1>
              <p className="hero-copy">
                Use the watermarker for quick text marks, or switch to the collage maker to turn
                multiple photos into one shareable image.
              </p>
            </div>
          </div>
          <div className="tool-switcher" role="tablist" aria-label="Photo tools">
            <button
              type="button"
              role="tab"
              aria-selected={activeTool === 'watermark'}
              className={`tool-switch-button ${activeTool === 'watermark' ? 'is-active' : ''}`}
              onClick={() => setActiveTool('watermark')}
            >
              Photo Watermarker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTool === 'collage'}
              className={`tool-switch-button ${activeTool === 'collage' ? 'is-active' : ''}`}
              onClick={() => setActiveTool('collage')}
            >
              Collage Maker
            </button>
          </div>
        </section>

        {activeTool === 'watermark' ? <WatermarkTool /> : <CollageMaker />}
      </main>

      <footer className="site-footer">
        <div className="site-footer-card">
          <div className="site-footer-brand">
            <img src={logoUrl} alt="" aria-hidden="true" />
            <div>
              <p className="site-footer-title">Photo Watermarker</p>
              <p className="site-footer-copy">
                Add clean text watermarks, build simple collages, and save everything right on
                your device.
              </p>
            </div>
          </div>
          <p className="site-footer-meta">
            © 2026 Photo Watermarker. Watermarks and collages stay on your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
