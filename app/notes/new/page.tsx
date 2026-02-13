"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Sparkles,
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import ProtectedRoute from "@/components/protected-route";
import ExcalidrawModal from "@/components/excalidraw-modal";
import { DuplicateTitleModal } from "@/components/duplicate-title-modal";
import NavigationTabs from "@/components/navigation-tabs";
import { SlashCommandMenu } from "./slash-command-menu";
import { BlockquoteButton } from "@/components/blockquote-button";
import { ColorHighlightPopover } from "@/components/color-highlight-popover";
import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";

interface NoteEditorPageProps {
  initialTitle?: string;
  initialContent?: string;
  noteId?: number;
  isEditing?: boolean;
}


export default function NoteEditorPage({
  initialTitle = "",
  initialContent = "",
  noteId,
  isEditing = false,
}: NoteEditorPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [isSaveClicked, setIsSaveClicked] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; blockPos?: number }>({ show: false, x: 0, y: 0 });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: "is-editor-empty",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: initialContent || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[70vh] px-4 py-2 notion-editor",
      },
      handleKeyDown: (view, event) => {
        // Handle slash command menu
        if (event.key === "/" && !showSlashMenu) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          const editorRect = view.dom.getBoundingClientRect();
          setSlashMenuPosition({ 
            top: coords.top - editorRect.top + 20,
            left: coords.left - editorRect.left 
          });
          setShowSlashMenu(true);
        }
        if (event.key === "Escape" && showSlashMenu) {
          setShowSlashMenu(false);
        }
        // Undo: Ctrl+Z
        if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
          event.preventDefault();
          editor?.chain().focus().undo().run();
          return true;
        }
        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
          event.preventDefault();
          editor?.chain().focus().redo().run();
          return true;
        }
        // Save: Ctrl+S
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          handleSave();
          return true;
        }
        return false;
      },
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    setIsSaveClicked(true);

    const content = editor.getHTML();
    const noteTitle = title.trim() || "Untitled";
    
    // Store in localStorage for now (can be replaced with API call)
    const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    
    // Check for duplicate title (excluding current note when editing)
    const duplicateNote = savedNotes.find((note: any) => 
      note.title.toLowerCase() === noteTitle.toLowerCase() && 
      note.id !== (isEditing ? noteId : null)
    );
    
    if (duplicateNote) {
      setShowDuplicateModal(true);
      return;
    }
    
    if (isEditing && noteId) {
      const updatedNotes = savedNotes.map((note: any) =>
        note.id === noteId
          ? { ...note, title: noteTitle, content, updatedAt: new Date().toISOString() }
          : note
      );
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
    } else {
      const newNote = {
        id: Date.now(),
        title: noteTitle,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("notes", JSON.stringify([newNote, ...savedNotes]));
    }

    router.push("/notes");
  }, [title, editor, isEditing, noteId, router]);

  const handleInsertImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleInsertDrawing = useCallback(
    (drawingData: string) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .insertContent(`\n\`\`\`drawing\n${drawingData}\n\`\`\`\n`)
          .run();
      }
      setIsDrawingModalOpen(false);
    },
    [editor]
  );

  // Block context menu handlers
  const handleBlockContextMenu = (e: React.MouseEvent, blockPos: number) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, blockPos });
  };

  const handleDuplicateBlock = () => {
    if (editor && contextMenu.blockPos !== undefined) {
      const { state } = editor;
      const node = state.doc.nodeAt(contextMenu.blockPos);
      if (node) {
        editor.chain().focus().insertContentAt(contextMenu.blockPos + node.nodeSize, node.toJSON()).run();
      }
    }
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  const handleDeleteBlock = () => {
    if (editor && contextMenu.blockPos !== undefined) {
      editor.chain().focus().deleteRange({ from: contextMenu.blockPos, to: contextMenu.blockPos + 1 }).run();
    }
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0 });
    if (contextMenu.show) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.show]);

  // Close slash command menu on click/tap outside
  useEffect(() => {
    if (!showSlashMenu) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        setShowSlashMenu(false);
        return;
      }

      if (target.closest(".slash-command-menu")) return;
      setShowSlashMenu(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showSlashMenu]);

  // Global Ctrl+S keyboard shortcut (works from anywhere on the page)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  if (!editor) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
        <NavigationTabs activeTab="everything" onTabChange={() => {}} />
        <Sidebar />

        {/* Header */}
        <header className="fixed top-0 left-14 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="relative h-12 flex items-center">
            {/* Back button - left margin */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/notes")}
              className="h-7 w-7 absolute left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Center content */}
            <span className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              {isEditing ? "Editing" : "New note"}
            </span>

            {/* Right side buttons */}
            <div className="absolute right-4 flex items-center gap-2">
              <button 
                onClick={handleSave}
                className="text-sm font-medium transition-colors hover:text-[#E8613A]"
              >
                Save
              </button>
            </div>
          </div>
        </header>

        <main className="ml-14 pt-16 pb-20">
          <div className="w-full px-12 lg:px-20">
            {/* Title Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <input
                type="text"
                placeholder="Untitled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    editor?.chain().focus().run();
                  }
                }}
                className="text-4xl font-serif italic bg-transparent px-2 placeholder:text-muted-foreground/30 placeholder:font-serif focus:outline-none py-3 w-full overflow-visible"
              />
              <div className="h-px bg-border mt-4" />
            </motion.div>

            {/* Editor with Block Handles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative"
            >
              {/* Block hover handles */}
              <div className="absolute -left-12 top-0 bottom-0 w-10 hidden lg:block">
                {editor && (
                  <BlockHandles 
                    editor={editor} 
                    onContextMenu={handleBlockContextMenu}
                  />
                )}
              </div>

              <EditorContent editor={editor} className="min-h-[80vh] text-lg" />

              {/* Slash Command Menu */}
              {showSlashMenu && (
                <SlashCommandMenu
                  editor={editor}
                  position={slashMenuPosition}
                  onClose={() => setShowSlashMenu(false)}
                  onInsertImage={handleInsertImage}
                  onInsertDrawing={() => setIsDrawingModalOpen(true)}
                />
              )}
            </motion.div>

            {/* Floating Toolbar */}
            {editor && <FloatingToolbar editor={editor} />}
          </div>
        </main>

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-lg shadow-lg py-1"
            >
              <button
                onClick={handleDuplicateBlock}
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent text-left"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
              <button
                onClick={handleDeleteBlock}
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent text-left text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ExcalidrawModal
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
          onSave={handleInsertDrawing}
        />

        <DuplicateTitleModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}

// Bubble Menu Button
interface BubbleButtonProps {
  editor: Editor;
  command: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}

function BubbleButton({ editor, command, isActive, icon, label }: BubbleButtonProps) {
  const handleClick = () => {
    if (command === "toggleLink") {
      const url = window.prompt("Enter URL:");
      if (url) {
        editor.chain().focus().toggleLink({ href: url }).run();
      }
    } else {
      (editor.chain().focus() as any)[command]().run();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded hover:bg-accent transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}

// Block Handles Component
interface BlockHandlesProps {
  editor: Editor;
  onContextMenu: (e: React.MouseEvent, pos: number) => void;
}

function BlockHandles({ editor, onContextMenu }: BlockHandlesProps) {
  const [blocks, setBlocks] = useState<Array<{ pos: number; nodeSize: number }>>([]);

  useEffect(() => {
    const updateBlocks = () => {
      const newBlocks: Array<{ pos: number; nodeSize: number }> = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.isBlock && node.type.name !== "doc") {
          newBlocks.push({ pos, nodeSize: node.nodeSize });
        }
      });
      setBlocks(newBlocks);
    };

    updateBlocks();
    editor.on("update", updateBlocks);
    return () => {
      editor.off("update", updateBlocks);
    };
  }, [editor]);

  return (
    <div className="relative h-full">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="absolute group"
          style={{ top: editor.view.coordsAtPos(block.pos).top - editor.view.coordsAtPos(0).top }}
        >
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => onContextMenu(e as any, block.pos)}
              className="p-1 hover:bg-accent rounded text-muted-foreground/50 hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().insertContentAt(block.pos + block.nodeSize, "\n").run()}
              className="p-1 hover:bg-accent rounded text-muted-foreground/50 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Floating Toolbar Component (replaces BubbleMenu)
interface FloatingToolbarProps {
  editor: Editor;
}

function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const { state } = editor;
      const { selection } = state;
      
      if (selection.empty || editor.isActive("imageUpload")) {
        setIsVisible(false);
        return;
      }

      const { from, to } = selection;
      const startPos = editor.view.coordsAtPos(from);
      const endPos = editor.view.coordsAtPos(to);
      
      const selectionCenter = (startPos.left + endPos.left) / 2;
      const selectionTop = Math.min(startPos.top, endPos.top);
      
      setPosition({
        top: selectionTop - 50,
        left: selectionCenter,
      });
      setIsVisible(true);
    };

    editor.on("selectionUpdate", updatePosition);
    editor.on("update", updatePosition);
    
    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("update", updatePosition);
    };
  }, [editor]);

  if (!isVisible || !position) return null;

  const handleBold = () => editor.chain().focus().toggleBold().run();
  const handleItalic = () => editor.chain().focus().toggleItalic().run();
  const handleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const handleStrike = () => editor.chain().focus().toggleStrike().run();
  const handleLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 p-1.5 bg-popover border border-border rounded-lg shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <ToolbarBtn
        onClick={handleBold}
        isActive={editor.isActive("bold")}
        icon={<Bold className="h-3.5 w-3.5" />}
        label="Bold"
      />
      <ToolbarBtn
        onClick={handleItalic}
        isActive={editor.isActive("italic")}
        icon={<Italic className="h-3.5 w-3.5" />}
        label="Italic"
      />
      <ToolbarBtn
        onClick={handleUnderline}
        isActive={editor.isActive("underline")}
        icon={<UnderlineIcon className="h-3.5 w-3.5" />}
        label="Underline"
      />
      <ToolbarBtn
        onClick={handleStrike}
        isActive={editor.isActive("strike")}
        icon={<Strikethrough className="h-3.5 w-3.5" />}
        label="Strikethrough"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <BlockquoteButton editor={editor} />
      <ColorHighlightPopover editor={editor} />
      <CopyToClipboardButton
        editor={editor}
        hideWhenUnavailable={true}
        showShortcut={false}
      />
      <ImageUploadButton
        editor={editor}
        hideWhenUnavailable={true}
        showShortcut={false}
        onInserted={() => console.log("Image inserted!")}
      />
      <ToolbarBtn
        onClick={handleLink}
        isActive={editor.isActive("link")}
        icon={<LinkIcon className="h-3.5 w-3.5" />}
        label="Link"
      />
    </div>
  );
}

interface ToolbarBtnProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}

function ToolbarBtn({ onClick, isActive, icon, label }: ToolbarBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-accent transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
