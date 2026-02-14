"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import ProtectedRoute from "@/components/protected-route";
import NavigationTabs from "@/components/navigation-tabs";
import { DuplicateTitleModal } from "@/components/duplicate-title-modal";
import { FloatingToolbar } from "@/components/notes/floating-toolbar";
import { SlashCommandMenu } from "@/components/notes/slash-command-menu";
import { DrawingModal } from "@/components/notes/drawing-modal";
import { DragHandle } from "@/components/notes/drag-handle-extension";
import { useAuth } from "@/contexts/auth-context";
import { saveNoteToLocal, saveNoteToFirestore } from "@/lib/notes-service";

interface NoteEditorProps {
  noteId?: number;
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  createdAt?: string | null;
}

export function NoteEditor({
  noteId,
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  createdAt = null,
}: NoteEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Refs for values accessed inside editor closures
  const showSlashMenuRef = useRef(false);
  const titleRef = useRef(title);
  const noteIdRef = useRef(noteId ?? Date.now());

  // Keep refs in sync
  useEffect(() => {
    showSlashMenuRef.current = showSlashMenu;
  }, [showSlashMenu]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: "is-editor-empty",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true, inline: false }),
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      DragHandle,
    ],
    content: initialContent || "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[70vh] pl-8 pr-4 py-2 notion-editor",
      },
      handleKeyDown: (_view, event) => {
        // When slash menu is open, intercept navigation keys so ProseMirror ignores them
        if (showSlashMenuRef.current) {
          if (
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "Enter" ||
            event.key === "Escape"
          ) {
            // Return true tells ProseMirror the event is handled — don't move cursor
            return true;
          }
        }

        if (event.key === "/" && !showSlashMenuRef.current) {
          const { from } = _view.state.selection;
          const coords = _view.coordsAtPos(from);
          const editorRect = _view.dom.getBoundingClientRect();
          setSlashMenuPosition({
            top: coords.top - editorRect.top + 20,
            left: coords.left - editorRect.left,
          });
          setShowSlashMenu(true);
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          handleExplicitSave();
          return true;
        }
        return false;
      },
    },
  });

  // Update editor content when initialContent changes (for edit page loading)
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // --- Auto-save to localStorage (debounced 2s) ---
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const content = editor.getHTML();
        const noteTitle = titleRef.current.trim() || "Untitled";
        saveNoteToLocal({
          id: noteIdRef.current,
          title: noteTitle,
          content,
          createdAt: createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 2000);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editor, createdAt]);

  // Also auto-save when title changes
  useEffect(() => {
    if (!editor) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const content = editor.getHTML();
      const noteTitle = title.trim() || "Untitled";
      saveNoteToLocal({
        id: noteIdRef.current,
        title: noteTitle,
        content,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 2000);
  }, [title, editor, createdAt]);

  // Save to localStorage on beforeunload as fallback
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!editor) return;
      const content = editor.getHTML();
      const noteTitle = titleRef.current.trim() || "Untitled";
      saveNoteToLocal({
        id: noteIdRef.current,
        title: noteTitle,
        content,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editor, createdAt]);

  // --- Explicit save (Ctrl+S) with duplicate-title check ---
  const handleExplicitSave = useCallback(() => {
    if (!editor) return;

    const content = editor.getHTML();
    const noteTitle = title.trim() || "Untitled";
    const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");

    const duplicateNote = savedNotes.find(
      (note: any) =>
        note.title.toLowerCase() === noteTitle.toLowerCase() &&
        note.id !== noteIdRef.current
    );
    if (duplicateNote) {
      setShowDuplicateModal(true);
      return;
    }

    saveNoteToLocal({
      id: noteIdRef.current,
      title: noteTitle,
      content,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    router.push("/notes");
  }, [title, editor, router, createdAt]);

  // --- Navigate back: save to localStorage + Firebase ---
  const handleBack = useCallback(async () => {
    if (editor) {
      const content = editor.getHTML();
      const noteTitle = titleRef.current.trim() || "Untitled";
      const noteData = {
        id: noteIdRef.current,
        title: noteTitle,
        content,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage immediately
      saveNoteToLocal(noteData);

      // Save to Firebase in background
      if (user?.uid) {
        saveNoteToFirestore(user.uid, noteData).catch((err) =>
          console.error("Firebase save failed:", err)
        );
      }
    }
    router.push("/notes");
  }, [editor, router, user, createdAt]);

  const handleInsertImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          editor.chain().focus().setImage({ src: dataUrl }).run();
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [editor]
  );

  const handleInsertDrawing = useCallback(() => {
    setShowDrawingModal(true);
  }, []);

  const handleSaveDrawing = useCallback(
    (imageDataUrl: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: imageDataUrl }).run();
      }
    },
    [editor]
  );

  // Close slash menu on click outside
  useEffect(() => {
    if (!showSlashMenu) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.closest(".slash-command-menu")) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showSlashMenu]);

  // Global Ctrl+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleExplicitSave();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleExplicitSave]);

  if (!editor) return null;

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-background"
        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
      >
        <NavigationTabs activeTab="everything" onTabChange={() => {}} />
        <Sidebar />

        {/* Header */}
        <header className="fixed top-0 left-14 right-0 z-40 bg-background/80 backdrop-blur-sm ">
          <div className="relative h-12 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-7 w-7 absolute left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="ml-14 pt-16 pb-20">
          <div className="w-full px-12 lg:px-20">
            {/* Title */}
            <div className="mb-2">
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
            </div>

            {/* Editor */}
            <div className="relative">
              <EditorContent editor={editor} className="min-h-[80vh] text-lg" />

              {showSlashMenu && (
                <SlashCommandMenu
                  editor={editor}
                  position={slashMenuPosition}
                  onClose={() => setShowSlashMenu(false)}
                  onInsertImage={handleInsertImage}
                  onInsertDrawing={handleInsertDrawing}
                />
              )}
            </div>

            {editor && <FloatingToolbar editor={editor} />}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {createdAt && (
              <div className="text-xs text-muted-foreground/60 mt-4 pt-3 border-t border-border/50">
                Created on{" "}
                {new Date(createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        </main>

        <DuplicateTitleModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
        />

        <DrawingModal
          isOpen={showDrawingModal}
          onClose={() => setShowDrawingModal(false)}
          onSave={handleSaveDrawing}
        />
      </div>
    </ProtectedRoute>
  );
}
