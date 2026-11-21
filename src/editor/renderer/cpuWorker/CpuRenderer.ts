import type { BaseImageSource, DocumentState, Renderer } from '../types';

interface WorkerMessage {
  type: 'rendered';
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

interface ExportMessage {
  type: 'exported';
  imageData: ImageData;
}

export class CpuRenderer implements Renderer {
  private worker: Worker | null = null;
  private state: DocumentState | null = null;
  private readonly canvas: HTMLCanvasElement;
  private readonly baseImage: BaseImageSource;
  private readonly onModeChange: (mode: 'gpu' | 'cpu' | 'none') => void;
  private readonly onReadyChange: (ready: boolean) => void;
  private readonly offscreenSupported: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    baseImage: BaseImageSource,
    onModeChange: (mode: 'gpu' | 'cpu' | 'none') => void,
    onReadyChange: (ready: boolean) => void
  ) {
    this.canvas = canvas;
    this.baseImage = baseImage;
    this.onModeChange = onModeChange;
    this.onReadyChange = onReadyChange;
    this.offscreenSupported = typeof OffscreenCanvas !== 'undefined';
  }

  async init() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.onModeChange('cpu');
    this.onReadyChange(true);
    this.worker.postMessage({ type: 'init', imageBitmap: this.baseImage.bitmap });
  }

  setDocumentState(state: DocumentState) {
    this.state = state;
    this.worker?.postMessage({ type: 'state', state });
  }

  render() {
    if (!this.worker || !this.state) {
      return;
    }
    const previewSize = this.getPreviewSize(this.baseImage.width, this.baseImage.height);
    const payload: { type: 'render'; width: number; height: number; preview: boolean; imageData?: ImageData } = {
      type: 'render',
      width: previewSize.width,
      height: previewSize.height,
      preview: true
    };

    if (!this.offscreenSupported) {
      payload.imageData = this.createImageData(previewSize.width, previewSize.height);
    }

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type !== 'rendered') {
        return;
      }
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      this.canvas.width = event.data.width;
      this.canvas.height = event.data.height;
      ctx.drawImage(event.data.bitmap, 0, 0);
    };
    if (payload.imageData) {
      this.worker.postMessage(payload, [payload.imageData.data.buffer]);
    } else {
      this.worker.postMessage(payload);
    }
  }

  async renderExport(width: number, height: number) {
    if (!this.worker || !this.state) {
      throw new Error('Renderer not ready');
    }

    return new Promise<ImageData>((resolve) => {
      this.worker?.addEventListener('message', (event: MessageEvent<ExportMessage>) => {
        if (event.data.type === 'exported') {
          resolve(event.data.imageData);
        }
      }, { once: true });

      const payload: { type: 'export'; width: number; height: number; imageData?: ImageData } = {
        type: 'export',
        width,
        height
      };

      if (!this.offscreenSupported) {
        payload.imageData = this.createImageData(width, height);
      }

      if (payload.imageData) {
        this.worker?.postMessage(payload, [payload.imageData.data.buffer]);
      } else {
        this.worker?.postMessage(payload);
      }
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.onReadyChange(false);
  }

  private getPreviewSize(width: number, height: number) {
    const maxEdge = 2048;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale)
    };
  }

  private createImageData(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }
    ctx.drawImage(this.baseImage.bitmap, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }
}
