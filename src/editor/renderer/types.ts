export interface Renderer {
  init: () => Promise<void>;
  setDocumentState: (state: DocumentState) => void;
  render: () => void;
  renderExport: (width: number, height: number) => Promise<ImageData | ImageBitmap>;
  dispose: () => void;
}

export interface BaseImageSource {
  id: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export interface DocumentState {
  baseImage: {
    width: number;
    height: number;
  };
  view: {
    zoom: number;
    panX: number;
    panY: number;
  };
  geometry: {
    crop: { x: number; y: number; width: number; height: number } | null;
    rotate: number;
    straighten: number;
    flipX: boolean;
    flipY: boolean;
    perspective: Array<{ x: number; y: number }>;
  };
  global: {
    exposure: number;
    contrast: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
    temperature: number;
    tint: number;
    vibrance: number;
    saturation: number;
  };
  hslMixer: HslChannel[];
  toneCurve: {
    points: Array<{ x: number; y: number }>;
    lut: Uint8Array;
  };
  localAdjustments: LocalAdjustmentLayer[];
}

export interface HslChannel {
  id: 'R' | 'O' | 'Y' | 'G' | 'A' | 'B' | 'P' | 'M';
  hue: number;
  sat: number;
  lum: number;
}

export interface LocalAdjustmentLayer {
  id: string;
  maskType: 'brush' | 'linear' | 'radial';
  adjustments: {
    exposure: number;
    contrast: number;
    saturation: number;
  };
  mask: ImageData | null;
}
