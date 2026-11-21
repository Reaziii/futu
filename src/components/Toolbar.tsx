import { useEditorStore } from '../store/editorStore';

const tools = [
  { id: 'move', label: 'Move/Zoom' },
  { id: 'crop', label: 'Crop' },
  { id: 'perspective', label: 'Perspective' },
  { id: 'brush', label: 'Brush Mask' },
  { id: 'linear', label: 'Linear Gradient' },
  { id: 'radial', label: 'Radial Gradient' }
] as const;

const Toolbar = () => {
  const activeTool = useEditorStore((state) => state.ui.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);

  return (
    <aside className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={activeTool === tool.id ? 'active' : ''}
          onClick={() => setActiveTool(tool.id)}
        >
          {tool.label}
        </button>
      ))}
    </aside>
  );
};

export default Toolbar;
