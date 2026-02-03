export const generateCurveLut = (points: Array<{ x: number; y: number }>) => {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const lut = new Uint8Array(256);

  for (let i = 0; i < 256; i += 1) {
    const x = i / 255;
    let left = sorted[0];
    let right = sorted[sorted.length - 1];

    for (let j = 0; j < sorted.length - 1; j += 1) {
      if (x >= sorted[j].x && x <= sorted[j + 1].x) {
        left = sorted[j];
        right = sorted[j + 1];
        break;
      }
    }

    const t = left === right ? 0 : (x - left.x) / (right.x - left.x);
    const y = left.y + t * (right.y - left.y);
    lut[i] = Math.round(Math.min(1, Math.max(0, y)) * 255);
  }

  return lut;
};

export const applyCurveLut = (r: number, g: number, b: number, lut: Uint8Array) => {
  const indexR = Math.min(255, Math.max(0, Math.round(r * 255)));
  const indexG = Math.min(255, Math.max(0, Math.round(g * 255)));
  const indexB = Math.min(255, Math.max(0, Math.round(b * 255)));

  return {
    r: lut[indexR] / 255,
    g: lut[indexG] / 255,
    b: lut[indexB] / 255
  };
};
