import { useEditorStore } from '../store/editorStore';

const TopBar = () => {
  const openImage = useEditorStore((state) => state.openImage);
  const exportImage = useEditorStore((state) => state.exportImage);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const reset = useEditorStore((state) => state.resetDocument);
  const toggleBeforeAfter = useEditorStore((state) => state.toggleBeforeAfter);
  const rendererMode = useEditorStore((state) => state.rendererMode);
  const rendererReady = useEditorStore((state) => state.rendererReady);

  return (
    <header className="top-bar">
      <div className="top-bar__left">
        <button type="button" onClick={openImage}>Open Image</button>
        <button type="button" onClick={exportImage} disabled={!rendererReady}>Export</button>
        <button type="button" onClick={undo}>Undo</button>
        <button type="button" onClick={redo}>Redo</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={toggleBeforeAfter}>Before/After</button>
      </div>
      <div className="top-bar__right">
        <span className={`renderer-pill ${rendererMode === 'gpu' ? 'gpu' : 'cpu'}`}>
          {rendererMode === 'gpu' ? 'GPU' : 'Compatibility'}
        </span>
      </div>
    </header>
  );
};

export default TopBar;
