import type { HslChannel } from '../editor/renderer/types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const rgbToHsl = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  return { h, s, l };
};

const hueToRgb = (p: number, q: number, t: number) => {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
};

export const hslToRgb = (h: number, s: number, l: number) => {
  if (s === 0) {
    return { r: l, g: l, b: l };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hueToRgb(p, q, h + 1 / 3),
    g: hueToRgb(p, q, h),
    b: hueToRgb(p, q, h - 1 / 3)
  };
};

const sectorCenters: Record<HslChannel['id'], number> = {
  R: 0,
  O: 1 / 12,
  Y: 2 / 12,
  G: 4 / 12,
  A: 6 / 12,
  B: 8 / 12,
  P: 10 / 12,
  M: 11 / 12
};

const sectorWeight = (hue: number, center: number) => {
  const diff = Math.min(Math.abs(hue - center), 1 - Math.abs(hue - center));
  const radius = 1 / 12;
  return Math.max(0, 1 - diff / radius);
};

export const applyHslMixerToPixel = (hsl: { h: number; s: number; l: number }, mixer: HslChannel[]) => {
  let hueShift = 0;
  let satShift = 0;
  let lumShift = 0;
  let totalWeight = 0;

  mixer.forEach((channel) => {
    const center = sectorCenters[channel.id];
    const weight = sectorWeight(hsl.h, center);
    if (weight > 0) {
      hueShift += channel.hue * weight;
      satShift += channel.sat * weight;
      lumShift += channel.lum * weight;
      totalWeight += weight;
    }
  });

  const weight = totalWeight === 0 ? 0 : 1 / totalWeight;
  const hue = (hsl.h + hueShift * weight + 1) % 1;
  const sat = clamp01(hsl.s + satShift * weight);
  const lum = clamp01(hsl.l + lumShift * weight);

  return { h: hue, s: sat, l: lum };
};
