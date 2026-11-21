import type { DocumentState } from '../types';
import { applyPipeline } from './workerPipeline';

interface InitMessage {
  type: 'init';
  imageBitmap?: ImageBitmap;
}

interface StateMessage {
  type: 'state';
  state: DocumentState;
}

interface RenderMessage {
  type: 'render';
  width: number;
  height: number;
  preview: boolean;
  imageData?: ImageData;
}

interface ExportMessage {
  type: 'export';
  width: number;
  height: number;
  imageData?: ImageData;
}

let baseBitmap: ImageBitmap | null = null;
let documentState: DocumentState | null = null;

const getBaseImageData = async (width: number, height: number) => {
  if (!baseBitmap) {
    throw new Error('No base image');
  }

  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas not supported');
  }

  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }
  ctx.drawImage(baseBitmap, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

self.onmessage = async (event: MessageEvent<InitMessage | StateMessage | RenderMessage | ExportMessage>) => {
  const data = event.data;
  if (data.type === 'init') {
    baseBitmap = data.imageBitmap ?? null;
    return;
  }
  if (data.type === 'state') {
    documentState = data.state;
    return;
  }
  if (data.type === 'render' && documentState) {
    const imageData = data.imageData ?? await getBaseImageData(data.width, data.height);
    const output = applyPipeline(imageData, documentState);
    const bitmap = await createImageBitmap(output);
    self.postMessage({ type: 'rendered', bitmap, width: data.width, height: data.height }, [bitmap]);
  }
  if (data.type === 'export' && documentState) {
    const imageData = data.imageData ?? await getBaseImageData(data.width, data.height);
    const output = applyPipeline(imageData, documentState);
    self.postMessage({ type: 'exported', imageData: output }, [output.data.buffer]);
  }
};
