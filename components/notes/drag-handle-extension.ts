import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NodeSelection } from "@tiptap/pm/state";

const GRIP_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
  <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
  <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
</svg>`;

export const DragHandle = Extension.create({
  name: "dragHandle",

  addProseMirrorPlugins() {
    let handleEl: HTMLDivElement | null = null;
    let currentBlockPos: number | null = null;

    const positionHandle = (view: any) => {
      if (!handleEl) return;

      try {
        const { selection } = view.state;
        const resolved = selection.$from;
        if (resolved.depth < 1) {
          handleEl.style.opacity = "0";
          return;
        }

        const blockStart = resolved.start(1);
        const dom = view.nodeDOM(blockStart - 1);
        if (dom && dom instanceof HTMLElement) {
          const blockRect = dom.getBoundingClientRect();
          const parentRect = view.dom.parentElement!.getBoundingClientRect();
          handleEl.style.top = `${blockRect.top - parentRect.top + 2}px`;
          handleEl.style.opacity = "1";
          currentBlockPos = blockStart - 1;
        } else {
          handleEl.style.opacity = "0";
        }
      } catch {
        handleEl.style.opacity = "0";
      }
    };

    return [
      new Plugin({
        key: new PluginKey("dragHandle"),
        view(editorView) {
          handleEl = document.createElement("div");
          handleEl.className = "drag-handle";
          handleEl.draggable = true;
          handleEl.contentEditable = "false";
          handleEl.innerHTML = GRIP_SVG;
          Object.assign(handleEl.style, {
            position: "absolute",
            left: "-24px",
            cursor: "grab",
            opacity: "0",
            transition: "opacity 0.15s",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "24px",
            borderRadius: "4px",
            zIndex: "10",
            userSelect: "none",
          });

          const wrapper = editorView.dom.parentElement;
          if (wrapper) {
            wrapper.style.position = "relative";
            wrapper.appendChild(handleEl);
          }

          const handleDragStart = (event: DragEvent) => {
            if (currentBlockPos === null) return;
            const node = editorView.state.doc.nodeAt(currentBlockPos);
            if (!node) return;

            const from = currentBlockPos;
            const to = from + node.nodeSize;

            // Select the block node
            const tr = editorView.state.tr;
            tr.setSelection(NodeSelection.create(editorView.state.doc, from));
            editorView.dispatch(tr);

            // Set ProseMirror drag data
            const slice = editorView.state.doc.slice(from, to);
            event.dataTransfer?.setData("text/html", "");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editorView as any).dragging = { slice, move: true };
          };

          handleEl.addEventListener("dragstart", handleDragStart);

          // Show handle for the initially selected block
          positionHandle(editorView);

          return {
            update(view) {
              positionHandle(view);
            },
            destroy() {
              handleEl?.remove();
            },
          };
        },
      }),
    ];
  },
});
