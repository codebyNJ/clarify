"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { GripVertical, Trash2, Copy, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface DragContextMenuProps {
  editor: Editor | null;
  withSlashCommandTrigger?: boolean;
  mobileBreakpoint?: number;
}

export function DragContextMenu({
  editor,
  withSlashCommandTrigger = true,
  mobileBreakpoint = 768,
}: DragContextMenuProps) {
  const [activeNode, setActiveNode] = useState<{ dom: HTMLElement; pos: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hoveredNodeRef = useRef<{ dom: HTMLElement; pos: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setActiveNode(null);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Handle slash command
  const handleSlashCommand = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent("/").run();
    setShowMenu(false);
  }, [editor]);

  // Delete node
  const handleDelete = useCallback(() => {
    if (!editor || !activeNode) return;
    editor.chain().focus().setNodeSelection(activeNode.pos).deleteSelection().run();
    setShowMenu(false);
  }, [activeNode, editor]);

  // Duplicate node
  const handleDuplicate = useCallback(() => {
    if (!editor || !activeNode) return;
    const node = editor.state.doc.nodeAt(activeNode.pos);
    if (node) {
      editor
        .chain()
        .focus()
        .insertContentAt(activeNode.pos + node.nodeSize, node.toJSON())
        .run();
    }
    setShowMenu(false);
  }, [activeNode, editor]);

  // Move node up
  const handleMoveUp = useCallback(() => {
    if (!editor || !activeNode) return;
    // Implementation for moving up would go here
    setShowMenu(false);
  }, [activeNode, editor]);

  // Move node down
  const handleMoveDown = useCallback(() => {
    if (!editor || !activeNode) return;
    // Implementation for moving down would go here
    setShowMenu(false);
  }, [activeNode, editor]);

  // Open menu
  const openMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const hovered = hoveredNodeRef.current;
    if (hovered) {
      setActiveNode(hovered);
    }

    setShowMenu(true);
  }, []);

  const dragHandleComputePositionConfig = useMemo(
    () => ({ placement: "left-start" as const, strategy: "absolute" as const }),
    [],
  );

  const handleNodeChange = useCallback(
    ({ pos }: { pos: number | null }) => {
      if (!editor) return;
      if (pos == null) {
        hoveredNodeRef.current = null;
        return;
      }

      const domNode = editor.view.nodeDOM(pos);
      const dom =
        domNode instanceof HTMLElement
          ? domNode
          : domNode && (domNode as Node).parentElement
            ? (domNode as Node).parentElement
            : null;

      if (!dom) {
        hoveredNodeRef.current = null;
        return;
      }

      hoveredNodeRef.current = { dom, pos };
    },
    [editor],
  );

  if (!editor || isMobile) return null;

  return (
    <>
      {/* Drag Handle on Hover (real drag & drop) */}
      <DragHandle
        editor={editor}
        computePositionConfig={dragHandleComputePositionConfig}
        nested={false}
        onNodeChange={handleNodeChange}
      >
        <div className="flex items-center gap-2 p-1">
          {withSlashCommandTrigger && (
            <button
              onClick={handleSlashCommand}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Slash command"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={openMenu}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Drag options"
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </DragHandle>

      {/* Context Menu */}
      {showMenu && activeNode && (
        <div
          ref={menuRef}
          className="fixed z-50 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          style={{
            left: Math.max(16, activeNode.dom.getBoundingClientRect().left - 200),
            top: activeNode.dom.getBoundingClientRect().top,
          }}
        >
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Block actions
            </div>
            
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            
            <button
              onClick={handleMoveUp}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <ArrowUp className="h-4 w-4" />
              Move up
            </button>
            
            <button
              onClick={handleMoveDown}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <ArrowDown className="h-4 w-4" />
              Move down
            </button>
            
            <div className="my-1 border-t border-border" />
            
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
}
