import { Extension } from "@tiptap/core";

export interface UiStateOptions {
  // No options for now
}

/**
 * UiState Extension
 * Manages UI state for drag operations and other UI interactions
 */
export const UiState = Extension.create<UiStateOptions>({
  name: "uiState",

  addStorage() {
    return {
      isDragging: false,
      draggedNode: null as HTMLElement | null,
      dragHandleVisible: false,
      contextMenuOpen: false,
    };
  },

  addCommands() {
    return {
      setDragging:
        (isDragging: boolean) =>
        ({ editor }) => {
          editor.storage.uiState.isDragging = isDragging;
          return true;
        },

      setDraggedNode:
        (node: HTMLElement | null) =>
        ({ editor }) => {
          editor.storage.uiState.draggedNode = node;
          return true;
        },

      setDragHandleVisible:
        (visible: boolean) =>
        ({ editor }) => {
          editor.storage.uiState.dragHandleVisible = visible;
          return true;
        },

      setContextMenuOpen:
        (open: boolean) =>
        ({ editor }) => {
          editor.storage.uiState.contextMenuOpen = open;
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [];
  },
});

export default UiState;
