import type { BaseImageSource, Renderer } from './types';
import { Webgl2Renderer } from './gpuWebgl2/Webgl2Renderer';
import { CpuRenderer } from './cpuWorker/CpuRenderer';

interface RendererOptions {
  canvas: HTMLCanvasElement;
  baseImage: BaseImageSource;
  onModeChange: (mode: 'gpu' | 'cpu' | 'none') => void;
  onReadyChange: (ready: boolean) => void;
}

export const createRenderer = ({ canvas, baseImage, onModeChange, onReadyChange }: RendererOptions): Renderer => {
  const supportsWebgl2 = () => {
    try {
      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  };

  let renderer: Renderer;

  if (supportsWebgl2()) {
    renderer = new Webgl2Renderer(canvas, baseImage, onModeChange, onReadyChange);
  } else {
    renderer = new CpuRenderer(canvas, baseImage, onModeChange, onReadyChange);
  }

  void renderer.init();
  return renderer;
};
