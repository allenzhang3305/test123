import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Row, Dot, ComboItem } from "@/types";

interface Result {
  url: string;
  image: string | null;
  title?: string;
  dots: Dot[];
}

interface HistoryEntry {
  rows: Row[];
  affectedIndex: number | null;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

interface RowsStore {
  rows: Row[];
  setRows: (rows: Row[], affectedIndex?: number | null) => void;
  clearRows: () => void;
  codeItems: ComboItem[];
  setCodeItems: (items: ComboItem[]) => void;
  clearCodeItems: () => void;
  results: Result[];
  setResults: (results: Result[]) => void;
  clearResults: () => void;
  // Upload states
  csvLoading: boolean;
  setCsvLoading: (loading: boolean) => void;
  csvError: string | null;
  setCsvError: (error: string | null) => void;
  jsLoading: boolean;
  setJsLoading: (loading: boolean) => void;
  jsError: string | null;
  setJsError: (error: string | null) => void;
  
  // Global History
  history: HistoryState;
  lastUndoRedoIndex: number | null;
  updateRow: (index: number, row: Row) => void;
  deleteRow: (index: number) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useRowsStore = create<RowsStore>()(
  devtools(
    (set) => ({
      rows: [],
      // setRows now pushes to history by default (affectedIndex defaults to null for bulk updates)
      setRows: (rows, affectedIndex = null) => set(state => {
        // Push current state to history before updating
        const newHistory = {
          past: [...state.history.past, { rows: state.rows, affectedIndex }],
          future: [],
        };
        return { rows, history: newHistory, lastUndoRedoIndex: null };
      }, false, "setRows"),
      
      // clearRows pushes empty state to history
      clearRows: () => set(state => {
        const newHistory = {
          past: [...state.history.past, { rows: state.rows, affectedIndex: null }],
          future: [],
        };
        return { rows: [], history: newHistory, lastUndoRedoIndex: null };
      }, false, "clearRows"),

      codeItems: [],
      setCodeItems: (codeItems) => set({ codeItems }, false, "setCodeItems"),
      clearCodeItems: () => set({ codeItems: [] }, false, "clearCodeItems"),
      results: [],
      setResults: (results) => set({ results }, false, "setResults"),
      clearResults: () => set({ results: [] }, false, "clearResults"),
      // Upload states
      csvLoading: false,
      setCsvLoading: (loading) => set({ csvLoading: loading }, false, "setCsvLoading"),
      csvError: null,
      setCsvError: (error) => set({ csvError: error }, false, "setCsvError"),
      jsLoading: false,
      setJsLoading: (loading) => set({ jsLoading: loading }, false, "setJsLoading"),
      jsError: null,
      setJsError: (error) => set({ jsError: error }, false, "setJsError"),

      // Global History Implementation
      history: { past: [], future: [] },
      lastUndoRedoIndex: null,

      updateRow: (index, newRow) =>
        set(
          (state) => {
            const newRows = [...state.rows];
            newRows[index] = newRow;
            
            const newHistory = {
              past: [...state.history.past, { rows: state.rows, affectedIndex: index }],
              future: [],
            };

            return {
              rows: newRows,
              history: newHistory,
              lastUndoRedoIndex: null,
            };
          },
          false,
          "updateRow"
        ),

      deleteRow: (index) =>
        set(
          (state) => {
            const newRows = [...state.rows];
            newRows.splice(index, 1);

            const newHistory = {
              past: [...state.history.past, { rows: state.rows, affectedIndex: index }],
              future: [],
            };

            return {
              rows: newRows,
              history: newHistory,
              lastUndoRedoIndex: null,
            };
          },
          false,
          "deleteRow"
        ),

      undo: () =>
        set(
          (state) => {
            const { past, future } = state.history;
            if (past.length === 0) return state;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, -1);
            
            // When undoing, we push current state to future.
            // affectedIndex is what we just "undid", so we use the previous entry's affectedIndex
            // to scroll to what changed in that step.
            const newFutureEntry = { rows: state.rows, affectedIndex: previous.affectedIndex };

            return {
              rows: previous.rows,
              history: {
                past: newPast,
                future: [newFutureEntry, ...future],
              },
              lastUndoRedoIndex: previous.affectedIndex,
            };
          },
          false,
          "undo"
        ),

      redo: () =>
        set(
          (state) => {
            const { past, future } = state.history;
            if (future.length === 0) return state;

            const next = future[0];
            const newFuture = future.slice(1);
            
            // When redoing, we push current state to past
            const newPastEntry = { rows: state.rows, affectedIndex: next.affectedIndex };

            return {
              rows: next.rows,
              history: {
                past: [...past, newPastEntry],
                future: newFuture,
              },
              lastUndoRedoIndex: next.affectedIndex,
            };
          },
          false,
          "redo"
        ),

      clearHistory: () =>
        set(
          { history: { past: [], future: [] }, lastUndoRedoIndex: null },
          false,
          "clearHistory"
        ),
    }),
    {
      name: "RowsStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
