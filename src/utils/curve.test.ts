import { describe, expect, it } from 'vitest';
import { applyCurveLut, generateCurveLut } from './curve';

describe('generateCurveLut', () => {
  it('maps endpoints correctly', () => {
    const lut = generateCurveLut([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]);
    expect(lut[0]).toBe(0);
    expect(lut[255]).toBe(255);
  });

  it('applies linear interpolation', () => {
    const lut = generateCurveLut([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]);
    expect(lut[128]).toBeGreaterThan(120);
  });
});

describe('applyCurveLut', () => {
  it('maps colors through LUT', () => {
    const lut = generateCurveLut([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]);
    const result = applyCurveLut(0.5, 0.25, 0.75, lut);
    expect(result.r).toBeCloseTo(0.5, 1);
    expect(result.g).toBeCloseTo(0.25, 1);
    expect(result.b).toBeCloseTo(0.75, 1);
  });
});
