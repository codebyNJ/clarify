import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export interface SlashCommandOptions {
  onSlashCommand: (position: { top: number; left: number }) => void;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onSlashCommand: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onSlashCommand } = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === '/') {
              console.log('[SlashCommand] Slash key detected');
              const { from } = view.state.selection;
              const coords = view.coordsAtPos(from);
              const editorRect = view.dom.getBoundingClientRect();
              const parentRect = view.dom.parentElement?.getBoundingClientRect();

              let position;
              if (parentRect) {
                position = {
                  top: coords.top - parentRect.top + 20,
                  left: coords.left - parentRect.left,
                };
              } else {
                position = {
                  top: coords.top - editorRect.top + 20,
                  left: coords.left - editorRect.left,
                };
              }

              console.log('[SlashCommand] Triggering callback with position:', position);
              onSlashCommand(position);
              return false; // Allow the "/" to be inserted
            }
            return false;
          },
        },
      }),
    ];
  },
});
