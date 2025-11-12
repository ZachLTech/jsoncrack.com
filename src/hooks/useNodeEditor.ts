import { create } from 'zustand';

interface NodeEditState {
  nodeId: string | null;
  rowIndex?: number; // For ObjectNode rows
  originalValue: string;
  editValue: string;
}

interface NodeEditorStore {
  editState: NodeEditState | null;
  isEditing: (nodeId: string, rowIndex?: number) => boolean;
  startEdit: (nodeId: string, value: string, rowIndex?: number) => void;
  updateEditValue: (value: string) => void;
  cancelEdit: () => void;
  getEditValue: () => string;
  hasChanges: () => boolean;
}

export const useNodeEditor = create<NodeEditorStore>((set, get) => ({
  editState: null,
  
  isEditing: (nodeId: string, rowIndex?: number): boolean => {
    const { editState } = get();
    if (!editState) return false;
    if (editState.nodeId !== nodeId) return false;
    if (rowIndex !== undefined && editState.rowIndex !== rowIndex) return false;
    if (rowIndex === undefined && editState.rowIndex !== undefined) return false;
    return true;
  },

  startEdit: (nodeId: string, value: string, rowIndex?: number) => {
    set({
      editState: {
        nodeId,
        rowIndex,
        originalValue: value,
        editValue: value,
      }
    });
  },

  updateEditValue: (value: string) => {
    set(state => ({
      editState: state.editState ? { ...state.editState, editValue: value } : null
    }));
  },

  cancelEdit: () => {
    set({ editState: null });
  },

  getEditValue: (): string => {
    const { editState } = get();
    return editState?.editValue || '';
  },

  hasChanges: (): boolean => {
    const { editState } = get();
    return editState ? editState.originalValue !== editState.editValue : false;
  },
}));