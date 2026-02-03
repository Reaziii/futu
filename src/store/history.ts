export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export type HistoryAction<T> =
  | { type: 'push'; next: T }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; next: T };

export const createHistoryState = <T,>(initial: T): HistoryState<T> => ({
  past: [],
  present: initial,
  future: []
});

export const historyReducer = <T,>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> => {
  switch (action.type) {
    case 'push':
      if (state.present === action.next) {
        return state;
      }
      return {
        past: [...state.past, state.present],
        present: action.next,
        future: []
      };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) {
        return state;
      }
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future]
      };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) {
        return state;
      }
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1)
      };
    }
    case 'reset':
      return {
        past: [],
        present: action.next,
        future: []
      };
    default:
      return state;
  }
};
