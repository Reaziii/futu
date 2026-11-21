import type { DocumentState } from '../editor/renderer/types';
import { generateCurveLut } from './curve';

export const createDefaultDocumentState = (): DocumentState => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ];
  return {
    baseImage: {
      width: 0,
      height: 0
    },
    view: {
      zoom: 1,
      panX: 0,
      panY: 0
    },
    geometry: {
      crop: null,
      rotate: 0,
      straighten: 0,
      flipX: false,
      flipY: false,
      perspective: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ]
    },
    global: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temperature: 0,
      tint: 0,
      vibrance: 0,
      saturation: 0
    },
    hslMixer: [
      { id: 'R', hue: 0, sat: 0, lum: 0 },
      { id: 'O', hue: 0, sat: 0, lum: 0 },
      { id: 'Y', hue: 0, sat: 0, lum: 0 },
      { id: 'G', hue: 0, sat: 0, lum: 0 },
      { id: 'A', hue: 0, sat: 0, lum: 0 },
      { id: 'B', hue: 0, sat: 0, lum: 0 },
      { id: 'P', hue: 0, sat: 0, lum: 0 },
      { id: 'M', hue: 0, sat: 0, lum: 0 }
    ],
    toneCurve: {
      points,
      lut: generateCurveLut(points)
    },
    localAdjustments: [
      {
        id: 'layer-1',
        maskType: 'brush',
        adjustments: { exposure: 0, contrast: 0, saturation: 0 },
        mask: null
      },
      {
        id: 'layer-2',
        maskType: 'linear',
        adjustments: { exposure: 0, contrast: 0, saturation: 0 },
        mask: null
      },
      {
        id: 'layer-3',
        maskType: 'radial',
        adjustments: { exposure: 0, contrast: 0, saturation: 0 },
        mask: null
      }
    ]
  };
};
