import type { DocumentState } from '../types';
import { applyCurveLut } from '../../../utils/curve';
import { applyHslMixerToPixel, rgbToHsl, hslToRgb } from '../../../utils/color';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const applyExposureContrast = (value: number, exposure: number, contrast: number) => {
  const exposureScale = Math.pow(2, exposure);
  let output = value * exposureScale;
  output = (output - 0.5) * (1 + contrast) + 0.5;
  return clamp01(output);
};

const applySaturation = (r: number, g: number, b: number, saturation: number) => {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mix = 1 + saturation;
  return {
    r: clamp01(luma + (r - luma) * mix),
    g: clamp01(luma + (g - luma) * mix),
    b: clamp01(luma + (b - luma) * mix)
  };
};

const applyTempTint = (r: number, g: number, b: number, temperature: number, tint: number) => {
  const temp = temperature * 0.08;
  const green = tint * -0.05;
  return {
    r: clamp01(r + temp + tint * 0.04),
    g: clamp01(g + green),
    b: clamp01(b - temp + tint * 0.02)
  };
};

export const applyPipeline = (imageData: ImageData, state: DocumentState) => {
  const data = imageData.data;
  const lut = state.toneCurve.lut;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    r = applyExposureContrast(r, state.global.exposure, state.global.contrast);
    g = applyExposureContrast(g, state.global.exposure, state.global.contrast);
    b = applyExposureContrast(b, state.global.exposure, state.global.contrast);

    const tempTint = applyTempTint(r, g, b, state.global.temperature, state.global.tint);
    r = tempTint.r;
    g = tempTint.g;
    b = tempTint.b;

    const sat = applySaturation(r, g, b, state.global.saturation + state.global.vibrance * 0.5);
    r = sat.r;
    g = sat.g;
    b = sat.b;

    const hsl = rgbToHsl(r, g, b);
    const adjusted = applyHslMixerToPixel(hsl, state.hslMixer);
    const rgb = hslToRgb(adjusted.h, adjusted.s, adjusted.l);

    r = rgb.r;
    g = rgb.g;
    b = rgb.b;

    const curve = applyCurveLut(r, g, b, lut);
    data[i] = Math.round(curve.r * 255);
    data[i + 1] = Math.round(curve.g * 255);
    data[i + 2] = Math.round(curve.b * 255);
  }

  return imageData;
};
