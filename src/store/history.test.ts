import { describe, expect, it } from 'vitest';
import { createHistoryState, historyReducer } from './history';

describe('history reducer', () => {
  it('handles undo/redo flow', () => {
    const initial = createHistoryState({ value: 0 });
    const pushed = historyReducer(initial, { type: 'push', next: { value: 1 } });
    const undo = historyReducer(pushed, { type: 'undo' });
    const redo = historyReducer(undo, { type: 'redo' });

    expect(pushed.present.value).toBe(1);
    expect(undo.present.value).toBe(0);
    expect(redo.present.value).toBe(1);
  });
});
