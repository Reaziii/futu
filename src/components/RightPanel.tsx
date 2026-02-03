import { useMemo, useState } from 'react';
import Slider from './Slider';
import { useEditorStore } from '../store/editorStore';

const tabs = ['Light', 'Color', 'Geometry', 'Local'] as const;

type TabId = typeof tabs[number];

const RightPanel = () => {
  const [activeTab, setActiveTab] = useState<TabId>('Light');
  const adjustments = useEditorStore((state) => state.document.global);
  const updateGlobal = useEditorStore((state) => state.updateGlobalAdjustments);
  const toneCurve = useEditorStore((state) => state.document.toneCurve);
  const updateToneCurve = useEditorStore((state) => state.updateToneCurve);
  const hslMixer = useEditorStore((state) => state.document.hslMixer);
  const updateHslMixer = useEditorStore((state) => state.updateHslMixer);
  const geometry = useEditorStore((state) => state.document.geometry);
  const updateGeometry = useEditorStore((state) => state.updateGeometry);
  const localLayers = useEditorStore((state) => state.document.localAdjustments);
  const updateLocalLayer = useEditorStore((state) => state.updateLocalLayer);
  const exportSettings = useEditorStore((state) => state.ui.exportSettings);
  const updateExportSettings = useEditorStore((state) => state.updateExportSettings);

  const curvePoints = useMemo(() => toneCurve.points.map((point, index) => (
    <div key={`${point.x}-${index}`} className="curve-point">
      <span>{`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</span>
      <button type="button" onClick={() => updateToneCurve.removePoint(index)}>Remove</button>
    </div>
  )), [toneCurve.points, updateToneCurve]);

  return (
    <aside className="right-panel">
      <div className="right-panel__tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="right-panel__content">
        {activeTab === 'Light' && (
          <div className="panel-section">
            <Slider label="Exposure" min={-2} max={2} value={adjustments.exposure} onChange={(value) => updateGlobal({ exposure: value })} />
            <Slider label="Contrast" min={-1} max={1} value={adjustments.contrast} onChange={(value) => updateGlobal({ contrast: value })} />
            <Slider label="Highlights" min={-1} max={1} value={adjustments.highlights} onChange={(value) => updateGlobal({ highlights: value })} />
            <Slider label="Shadows" min={-1} max={1} value={adjustments.shadows} onChange={(value) => updateGlobal({ shadows: value })} />
            <Slider label="Whites" min={-1} max={1} value={adjustments.whites} onChange={(value) => updateGlobal({ whites: value })} />
            <Slider label="Blacks" min={-1} max={1} value={adjustments.blacks} onChange={(value) => updateGlobal({ blacks: value })} />
          </div>
        )}

        {activeTab === 'Color' && (
          <div className="panel-section">
            <Slider label="Temperature" min={-1} max={1} value={adjustments.temperature} onChange={(value) => updateGlobal({ temperature: value })} />
            <Slider label="Tint" min={-1} max={1} value={adjustments.tint} onChange={(value) => updateGlobal({ tint: value })} />
            <Slider label="Vibrance" min={-1} max={1} value={adjustments.vibrance} onChange={(value) => updateGlobal({ vibrance: value })} />
            <Slider label="Saturation" min={-1} max={1} value={adjustments.saturation} onChange={(value) => updateGlobal({ saturation: value })} />

            <div className="panel-subsection">
              <h4>HSL Mixer</h4>
              {hslMixer.map((channel, index) => (
                <div key={channel.id} className="hsl-channel">
                  <strong>{channel.id}</strong>
                  <Slider
                    label="Hue"
                    min={-0.25}
                    max={0.25}
                    value={channel.hue}
                    onChange={(value) => updateHslMixer(index, { hue: value })}
                  />
                  <Slider
                    label="Sat"
                    min={-1}
                    max={1}
                    value={channel.sat}
                    onChange={(value) => updateHslMixer(index, { sat: value })}
                  />
                  <Slider
                    label="Lum"
                    min={-1}
                    max={1}
                    value={channel.lum}
                    onChange={(value) => updateHslMixer(index, { lum: value })}
                  />
                </div>
              ))}
            </div>

            <div className="panel-subsection">
              <h4>Tone Curve</h4>
              <div className="curve-controls">
                <button type="button" onClick={() => updateToneCurve.addPoint()}>
                  Add Point
                </button>
                <button type="button" onClick={() => updateToneCurve.reset()}>
                  Reset Curve
                </button>
              </div>
              <div className="curve-points">{curvePoints}</div>
            </div>
          </div>
        )}

        {activeTab === 'Geometry' && (
          <div className="panel-section">
            <Slider
              label="Rotate"
              min={-180}
              max={180}
              step={1}
              value={geometry.rotate}
              onChange={(value) => updateGeometry({ rotate: value })}
            />
            <Slider
              label="Straighten"
              min={-10}
              max={10}
              step={0.1}
              value={geometry.straighten}
              onChange={(value) => updateGeometry({ straighten: value })}
            />
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={geometry.flipX}
                  onChange={(event) => updateGeometry({ flipX: event.target.checked })}
                />
                Flip Horizontal
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={geometry.flipY}
                  onChange={(event) => updateGeometry({ flipY: event.target.checked })}
                />
                Flip Vertical
              </label>
            </div>
          </div>
        )}

        {activeTab === 'Local' && (
          <div className="panel-section">
            {localLayers.map((layer, index) => (
              <div key={layer.id} className="local-layer">
                <h4>{`Layer ${index + 1} (${layer.maskType})`}</h4>
                <Slider
                  label="Exposure"
                  min={-1}
                  max={1}
                  value={layer.adjustments.exposure}
                  onChange={(value) => updateLocalLayer(layer.id, { exposure: value })}
                />
                <Slider
                  label="Contrast"
                  min={-1}
                  max={1}
                  value={layer.adjustments.contrast}
                  onChange={(value) => updateLocalLayer(layer.id, { contrast: value })}
                />
                <Slider
                  label="Saturation"
                  min={-1}
                  max={1}
                  value={layer.adjustments.saturation}
                  onChange={(value) => updateLocalLayer(layer.id, { saturation: value })}
                />
              </div>
            ))}
          </div>
        )}

        <div className="panel-section">
          <h4>Export</h4>
          <label className="export-row">
            Format
            <select
              value={exportSettings.format}
              onChange={(event) => updateExportSettings({ format: event.target.value as 'png' | 'jpeg' | 'webp' })}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
          {exportSettings.format !== 'png' && (
            <Slider
              label="Quality"
              min={0.1}
              max={1}
              step={0.05}
              value={exportSettings.quality}
              onChange={(value) => updateExportSettings({ quality: value })}
            />
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
