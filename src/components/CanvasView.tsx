import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

interface CanvasViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CanvasView = ({ canvasRef }: CanvasViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openImage = useEditorStore((state) => state.openImage);
  const setViewTransform = useEditorStore((state) => state.setViewTransform);
  const viewTransform = useEditorStore((state) => state.document.view);
  const isLoading = useEditorStore((state) => state.ui.isLoading);
  const compatibilityMessage = useEditorStore((state) => state.ui.compatibilityMessage);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer?.files?.length) {
      return;
    }
    openImage(event.dataTransfer.files[0]);
  }, [openImage]);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [handleDrop, handleDragOver]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === '+' || event.key === '=') {
        setViewTransform({ zoom: Math.min(8, viewTransform.zoom + 0.1) });
      }
      if (event.key === '-') {
        setViewTransform({ zoom: Math.max(0.1, viewTransform.zoom - 0.1) });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setViewTransform, viewTransform.zoom]);

  return (
    <main className="canvas-area" ref={containerRef}>
      {isLoading && <div className="loading-overlay">Decoding image…</div>}
      {compatibilityMessage && (
        <div className="compatibility-banner">{compatibilityMessage}</div>
      )}
      <canvas ref={canvasRef} className="editor-canvas" />
      <div className="canvas-hint">
        Drag & drop an image or use Open Image
      </div>
    </main>
  );
};

export default CanvasView;
