import { useEffect, useMemo, useRef } from 'react';
import TopBar from '../components/TopBar';
import Toolbar from '../components/Toolbar';
import RightPanel from '../components/RightPanel';
import CanvasView from '../components/CanvasView';
import { useEditorStore } from '../store/editorStore';
import { createRenderer } from '../editor/renderer/createRenderer';
import type { Renderer } from '../editor/renderer/types';
import '../styles/app.css';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImage = useEditorStore((state) => state.baseImage);
  const documentState = useEditorStore((state) => state.document);
  const rendererMode = useEditorStore((state) => state.rendererMode);
  const exportSettings = useEditorStore((state) => state.ui.exportSettings);
  const setRendererMode = useEditorStore((state) => state.setRendererMode);
  const setRendererReady = useEditorStore((state) => state.setRendererReady);
  const setCompatibilityMessage = useEditorStore((state) => state.setCompatibilityMessage);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  const rendererRef = useRef<Renderer | null>(null);

  const rendererDependency = useMemo(() => ({
    imageId: baseImage?.id ?? null,
    mode: rendererMode
  }), [baseImage, rendererMode]);

  useEffect(() => {
    if (!canvasRef.current || !baseImage) {
      return;
    }

    const renderer = createRenderer({
      canvas: canvasRef.current,
      baseImage,
      onModeChange: setRendererMode,
      onReadyChange: setRendererReady
    });

    rendererRef.current = renderer;
    renderer.setDocumentState(documentState);
    renderer.render();

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [rendererDependency, baseImage, setRendererMode, setRendererReady]);

  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }
    rendererRef.current.setDocumentState(documentState);
    rendererRef.current.render();
  }, [documentState]);

  useEffect(() => {
    if (rendererMode === 'cpu') {
      setCompatibilityMessage('Compatibility mode: using CPU renderer for maximum support.');
    } else if (rendererMode === 'none') {
      setCompatibilityMessage('Renderer unavailable.');
    } else {
      setCompatibilityMessage(null);
    }
  }, [rendererMode, setCompatibilityMessage]);

  useEffect(() => {
    const handler = async () => {
      if (!rendererRef.current || !baseImage) {
        return;
      }
      const imageData = await rendererRef.current.renderExport(baseImage.width, baseImage.height);
      const canvas = document.createElement('canvas');
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      if (imageData instanceof ImageData) {
        ctx.putImageData(imageData, 0, 0);
      } else {
        ctx.drawImage(imageData, 0, 0);
      }
      const mimeType = exportSettings.format === 'png' ? 'image/png' : `image/${exportSettings.format}`;
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export.${exportSettings.format}`;
        link.click();
        URL.revokeObjectURL(url);
      }, mimeType, exportSettings.format === 'png' ? undefined : exportSettings.quality);
    };
    window.addEventListener('editor-export', handler);
    return () => window.removeEventListener('editor-export', handler);
  }, [baseImage, exportSettings]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      if (!modifierKey) {
        return;
      }
      if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <Toolbar />
        <CanvasView canvasRef={canvasRef} />
        <RightPanel />
      </div>
    </div>
  );
};

export default App;
