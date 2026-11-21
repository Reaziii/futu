import { describe, expect, it } from 'vitest';
import { hslToRgb, rgbToHsl } from './color';

describe('color conversions', () => {
  it('round-trips red', () => {
    const hsl = rgbToHsl(1, 0, 0);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBeCloseTo(1, 2);
    expect(rgb.g).toBeCloseTo(0, 2);
    expect(rgb.b).toBeCloseTo(0, 2);
  });

  it('round-trips gray', () => {
    const hsl = rgbToHsl(0.5, 0.5, 0.5);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBeCloseTo(0.5, 2);
    expect(rgb.g).toBeCloseTo(0.5, 2);
    expect(rgb.b).toBeCloseTo(0.5, 2);
  });
});
