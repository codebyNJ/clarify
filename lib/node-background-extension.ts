import { Extension, type Editor, type Chain } from "@tiptap/core";

export interface NodeBackgroundOptions {
  types: string[];
}

/**
 * NodeBackground Extension
 * Adds background color support to block-level nodes
 */
export const NodeBackground = Extension.create<NodeBackgroundOptions>({
  name: "nodeBackground",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote", "codeBlock"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) =>
              element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) {
                return {};
              }
              return {
                style: `background-color: ${attributes.backgroundColor}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setNodeBackgroundColor:
        (color: string) =>
        ({ editor, chain }: { editor: Editor; chain: () => Chain }) => {
          return chain()
            .updateAttributes(editor.state.selection.$from.node().type.name, {
              backgroundColor: color,
            })
            .run();
        },

      unsetNodeBackgroundColor:
        () =>
        ({ editor, chain }: { editor: Editor; chain: () => Chain }) => {
          return chain()
            .updateAttributes(editor.state.selection.$from.node().type.name, {
              backgroundColor: null,
            })
            .run();
        },
    };
  },
});

export default NodeBackground;
