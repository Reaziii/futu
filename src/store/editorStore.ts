import { create } from 'zustand';
import type { DocumentState, HslChannel, LocalAdjustmentLayer } from '../editor/renderer/types';
import { createHistoryState, historyReducer } from './history';
import { createDefaultDocumentState } from '../utils/documentDefaults';
import { generateCurveLut } from '../utils/curve';

interface BaseImageHandle {
  id: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

interface UiState {
  activeTool: 'move' | 'crop' | 'perspective' | 'brush' | 'linear' | 'radial';
  isLoading: boolean;
  beforeAfter: boolean;
  compatibilityMessage: string | null;
  exportSettings: {
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
  };
}

interface EditorState {
  baseImage: BaseImageHandle | null;
  document: DocumentState;
  history: ReturnType<typeof createHistoryState<DocumentState>>;
  ui: UiState;
  rendererMode: 'gpu' | 'cpu' | 'none';
  rendererReady: boolean;
  openImage: (file?: File) => void;
  setRendererMode: (mode: 'gpu' | 'cpu' | 'none') => void;
  setRendererReady: (ready: boolean) => void;
  updateGlobalAdjustments: (update: Partial<DocumentState['global']>) => void;
  updateToneCurve: {
    addPoint: () => void;
    removePoint: (index: number) => void;
    reset: () => void;
  };
  updateHslMixer: (index: number, update: Partial<HslChannel>) => void;
  updateGeometry: (update: Partial<DocumentState['geometry']>) => void;
  updateLocalLayer: (id: string, update: Partial<LocalAdjustmentLayer['adjustments']>) => void;
  setActiveTool: (tool: UiState['activeTool']) => void;
  setViewTransform: (update: Partial<DocumentState['view']>) => void;
  toggleBeforeAfter: () => void;
  resetDocument: () => void;
  undo: () => void;
  redo: () => void;
  exportImage: () => void;
  setCompatibilityMessage: (message: string | null) => void;
  updateExportSettings: (update: Partial<UiState['exportSettings']>) => void;
}

const defaultDocument = createDefaultDocumentState();

const initialHistory = createHistoryState(defaultDocument);

const pushHistory = (setState: (fn: (state: EditorState) => Partial<EditorState>) => void, next: DocumentState) => {
  setState((state) => ({
    history: historyReducer(state.history, { type: 'push', next }),
    document: next
  }));
};

export const useEditorStore = create<EditorState>((set, get) => ({
  baseImage: null,
  document: defaultDocument,
  history: initialHistory,
  ui: {
    activeTool: 'move',
    isLoading: false,
    beforeAfter: false,
    compatibilityMessage: null,
    exportSettings: {
      format: 'png',
      quality: 0.9
    }
  },
  rendererMode: 'none',
  rendererReady: false,
  openImage: (file) => {
    const trigger = async () => {
      if (!file) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp';
        input.onchange = () => {
          const selected = input.files?.[0];
          if (selected) {
            get().openImage(selected);
          }
        };
        input.click();
        return;
      }

      set((state) => ({
        ui: { ...state.ui, isLoading: true }
      }));

      const bitmap = await createImageBitmap(file);
      const id = `${file.name}-${Date.now()}`;

      set((state) => ({
        baseImage: {
          id,
          bitmap,
          width: bitmap.width,
          height: bitmap.height
        },
        document: {
          ...state.document,
          baseImage: { width: bitmap.width, height: bitmap.height }
        },
        ui: { ...state.ui, isLoading: false }
      }));
    };

    void trigger();
  },
  setRendererMode: (mode) => set((state) => ({ rendererMode: mode })),
  setRendererReady: (ready) => set((state) => ({ rendererReady: ready })),
  updateGlobalAdjustments: (update) => {
    const next = {
      ...get().document,
      global: {
        ...get().document.global,
        ...update
      }
    };
    pushHistory(set, next);
  },
  updateToneCurve: {
    addPoint: () => {
      const nextPoints = [...get().document.toneCurve.points, { x: 0.5, y: 0.5 }];
      const next = {
        ...get().document,
        toneCurve: {
          points: nextPoints,
          lut: generateCurveLut(nextPoints)
        }
      };
      pushHistory(set, next);
    },
    removePoint: (index) => {
      const points = get().document.toneCurve.points.filter((_, i) => i !== index);
      const next = {
        ...get().document,
        toneCurve: {
          points,
          lut: generateCurveLut(points)
        }
      };
      pushHistory(set, next);
    },
    reset: () => {
      const base = createDefaultDocumentState();
      const next = {
        ...get().document,
        toneCurve: base.toneCurve
      };
      pushHistory(set, next);
    }
  },
  updateHslMixer: (index, update) => {
    const nextMixer = get().document.hslMixer.map((channel, i) => (
      i === index ? { ...channel, ...update } : channel
    ));
    const next = {
      ...get().document,
      hslMixer: nextMixer
    };
    pushHistory(set, next);
  },
  updateGeometry: (update) => {
    const next = {
      ...get().document,
      geometry: {
        ...get().document.geometry,
        ...update
      }
    };
    pushHistory(set, next);
  },
  updateLocalLayer: (id, update) => {
    const nextLayers = get().document.localAdjustments.map((layer) => (
      layer.id === id ? { ...layer, adjustments: { ...layer.adjustments, ...update } } : layer
    ));
    const next = {
      ...get().document,
      localAdjustments: nextLayers
    };
    pushHistory(set, next);
  },
  setActiveTool: (tool) => set((state) => ({ ui: { ...state.ui, activeTool: tool } })),
  setViewTransform: (update) => {
    const next = {
      ...get().document,
      view: {
        ...get().document.view,
        ...update
      }
    };
    set((state) => ({ document: next }));
  },
  toggleBeforeAfter: () => set((state) => ({ ui: { ...state.ui, beforeAfter: !state.ui.beforeAfter } })),
  resetDocument: () => {
    const resetState = createDefaultDocumentState();
    set(() => ({
      document: resetState,
      history: createHistoryState(resetState)
    }));
  },
  undo: () => set((state) => {
    const nextHistory = historyReducer(state.history, { type: 'undo' });
    return {
      history: nextHistory,
      document: nextHistory.present
    };
  }),
  redo: () => set((state) => {
    const nextHistory = historyReducer(state.history, { type: 'redo' });
    return {
      history: nextHistory,
      document: nextHistory.present
    };
  }),
  exportImage: () => {
    const event = new CustomEvent('editor-export');
    window.dispatchEvent(event);
  },
  setCompatibilityMessage: (message) => set((state) => ({ ui: { ...state.ui, compatibilityMessage: message } })),
  updateExportSettings: (update) => set((state) => ({
    ui: { ...state.ui, exportSettings: { ...state.ui.exportSettings, ...update } }
  }))
}));
