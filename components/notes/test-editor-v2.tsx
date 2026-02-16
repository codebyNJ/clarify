"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  EditorContent,
  EditorContext,
  useEditor,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useRouter } from "next/navigation";

// --- TipTap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { CharacterCount } from "@tiptap/extension-character-count";

// --- TipTap Node Extensions ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- TipTap Template Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

// --- TipTap Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Custom App Components ---
import { Button as ShadcnButton } from "@/components/ui/button";
import { DragHandle } from "@/components/notes/drag-handle-extension";
import { SlashCommandMenu } from "@/components/notes/slash-command-menu";
import { DrawingModal } from "@/components/notes/drawing-modal";
import Sidebar from "@/components/sidebar";
import ProtectedRoute from "@/components/protected-route";
import NavigationTabs from "@/components/navigation-tabs";
import { useAuth } from "@/contexts/auth-context";
import { saveDraft, clearDraft, saveNoteOnLeave } from "@/lib/notes-service";

// --- Lucide Icons ---
import {
  ArrowLeft,
  Cloud,
  CloudOff,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Copy,
  Check,
  CheckSquare,
  Paperclip,
  Pencil,
  SquarePen,
} from "lucide-react";
import NextLink from "next/link";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface TestEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  createdAt?: string | null;
}

// ─────────────────────────────────────────────
// Bubble Menu Button
// ─────────────────────────────────────────────
function BubbleBtn({
  onClick,
  isActive,
  icon,
  label,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? "bg-[var(--editor-bubble-active)] text-[var(--editor-text)]"
          : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)] hover:bg-[var(--editor-bubble-hover)]"
      }`}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Editor Component
// ─────────────────────────────────────────────
export function TestEditorV2({
  noteId,
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  createdAt = null,
}: TestEditorProps) {
  const router = useRouter();
  const { user } = useAuth();

  // --- State ---
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "offline"
  >("idle");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- Refs ---
  const showSlashMenuRef = useRef(false);
  const titleRef = useRef(title);
  const noteIdRef = useRef<string>((noteId ?? Date.now()).toString());
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    showSlashMenuRef.current = showSlashMenu;
  }, [showSlashMenu]);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // --- Editor ---
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "simple-editor notion-editor",
        spellcheck: "true",
      },
      handleKeyDown: (_view, event) => {
        if (showSlashMenuRef.current) {
          if (
            ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)
          ) {
            return true;
          }
        }

        if (event.key === "/" && !showSlashMenuRef.current) {
          const { from } = _view.state.selection;
          const coords = _view.coordsAtPos(from);
          const editorRect = _view.dom.getBoundingClientRect();
          setSlashMenuPosition({
            top: coords.top - editorRect.top + 24,
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
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, enableClickSelection: true },
      }),
      HorizontalRule,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading")
            return `Heading ${node.attrs.level}`;
          return "Type '/' for commands, or start writing...";
        },
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ allowBase64: true }),
      Typography,
      Superscript,
      Subscript,
      Underline,
      Selection,
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      DragHandle,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent || "",
  });

  // Update content when initialContent changes (edit page loading)
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // ─────────────────────────────────────────────
  // Auto-save draft (debounced 2s)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setSaveStatus("saving");
      autoSaveTimerRef.current = setTimeout(() => {
        const content = editor.getHTML();
        saveDraft({
          id: noteIdRef.current,
          title: titleRef.current.trim() || "Untitled",
          content,
          createdAt: createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 2000);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editor, createdAt]);

  // Auto-save on title change
  useEffect(() => {
    if (!editor) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const content = editor.getHTML();
      saveDraft({
        id: noteIdRef.current,
        title: title.trim() || "Untitled",
        content,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 2000);
  }, [title, editor, createdAt]);

  // Save draft on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!editor) return;
      saveDraft({
        id: noteIdRef.current,
        title: titleRef.current.trim() || "Untitled",
        content: editor.getHTML(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editor, createdAt]);

  // ─────────────────────────────────────────────
  // Explicit save (Ctrl+S)
  // ─────────────────────────────────────────────
  const handleExplicitSave = useCallback(async () => {
    if (!editor || !user?.uid) return;
    setSaveStatus("saving");
    const noteData = {
      id: noteIdRef.current,
      title: title.trim() || "Untitled",
      content: editor.getHTML(),
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveNoteOnLeave(user.uid, noteData);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("offline");
    }
    router.push("/notes");
  }, [title, editor, router, createdAt, user]);

  // Navigate back
  const handleBack = useCallback(async () => {
    if (editor && user?.uid) {
      const noteData = {
        id: noteIdRef.current,
        title: titleRef.current.trim() || "Untitled",
        content: editor.getHTML(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveNoteOnLeave(user.uid, noteData);
    } else {
      clearDraft();
    }
    router.push("/notes");
  }, [editor, router, user, createdAt]);

  // Image upload
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
        if (dataUrl) editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [editor]
  );

  // Drawing
  const handleInsertDrawing = useCallback(
    () => setShowDrawingModal(true),
    []
  );
  const handleSaveDrawing = useCallback(
    (imageDataUrl: string) => {
      if (editor)
        editor.chain().focus().setImage({ src: imageDataUrl }).run();
    },
    [editor]
  );

  // Copy selected text
  const handleCopy = useCallback(async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editor]);

  // Link
  const handleLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().toggleLink({ href: url }).run();
  }, [editor]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!showSlashMenu) return;
    const handle = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.closest(".slash-command-menu"))
        setShowSlashMenu(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showSlashMenu]);

  // Global Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleExplicitSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleExplicitSave]);

  // Word count
  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  if (!editor) return null;

  return (
    <ProtectedRoute>
      <div className="clarify-editor-page min-h-screen bg-[var(--editor-bg)]">
        <NavigationTabs activeTab="everything" onTabChange={() => {}} />
        <Sidebar />

        {/* ── Header ── */}
        <header className="fixed top-0 left-0 md:left-14 right-0 z-40 backdrop-blur-sm " style={{ background: "var(--editor-bg)" }}>
          <div className="relative h-12 flex items-center justify-between px-4">
            <ShadcnButton
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-7 w-7"
            >
              <ArrowLeft className="h-4 w-4" />
            </ShadcnButton>

            {/* Save status — center
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-muted-foreground select-none">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Saved to cloud</span>
                </>
              )}
              {saveStatus === "offline" && (
                <>
                  <CloudOff className="h-3.5 w-3.5" />
                  <span>Saved offline</span>
                </>
              )}
              {saveStatus === "idle" && (
                <Cloud className="h-3.5 w-3.5 opacity-40" />
              )}
            </div>

            Word count — right
            <div className="text-[10px] text-muted-foreground/50 select-none tabular-nums">
              {wordCount} words · {charCount} chars
            </div> */}
          </div> 
        </header>

        {/* ── Main content area ── */}
        <main className="ml-0 md:ml-14 pt-16 pb-16 md:pb-20">
          <div className="w-full px-4 md:px-12 lg:px-20">
            {/* Title */}
            <div className="mb-0">
              <input
                type="text"
                placeholder="Search my mind..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" || e.key === "Enter") {
                    e.preventDefault();
                    editor?.chain().focus().run();
                  }
                }}
                className="text-[28px] md:text-[40px] font-serif italic font-normal tracking-tight bg-transparent px-2 placeholder:text-[var(--editor-placeholder)] focus:outline-none py-1 w-full overflow-visible leading-tight text-[var(--editor-text)]"
              />
              <div className="h-px bg-[var(--editor-border)] mt-0.5" />
            </div>

            {/* ── TipTap Editor ── */}
            <EditorContext.Provider value={{ editor }}>
              {/* BubbleMenu — appears on text selection only */}
              <BubbleMenu
                editor={editor}
                options={{
                  placement: "top",
                  offset: { mainAxis: 8, crossAxis: 0 },
                  flip: { padding: 16, fallbackPlacements: ["bottom", "top-start", "bottom-start"] },
                  shift: { padding: 16, crossAxis: true },
                  inline: true,
                }}
                className="clarify-bubble-menu flex items-center gap-0.5 px-1.5 py-1 bg-[var(--editor-bubble-bg)] border border-[var(--editor-bubble-border)] rounded-lg shadow-xl backdrop-blur-md"
              >
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  isActive={editor.isActive("bold")}
                  icon={<Bold className="h-3.5 w-3.5" />}
                  label="Bold"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  isActive={editor.isActive("italic")}
                  icon={<Italic className="h-3.5 w-3.5" />}
                  label="Italic"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  isActive={editor.isActive("underline")}
                  icon={<UnderlineIcon className="h-3.5 w-3.5" />}
                  label="Underline"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  isActive={editor.isActive("strike")}
                  icon={<Strikethrough className="h-3.5 w-3.5" />}
                  label="Strikethrough"
                />

                <div className="w-px h-5 bg-[var(--editor-bubble-separator)] mx-0.5" />

                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  isActive={editor.isActive("code")}
                  icon={<Code className="h-3.5 w-3.5" />}
                  label="Inline Code"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  isActive={editor.isActive("highlight")}
                  icon={<Highlighter className="h-3.5 w-3.5" />}
                  label="Highlight"
                />
                <BubbleBtn
                  onClick={handleLink}
                  isActive={editor.isActive("link")}
                  icon={<LinkIcon className="h-3.5 w-3.5" />}
                  label="Link"
                />

                <div className="w-px h-5 bg-[var(--editor-bubble-separator)] mx-0.5" />

                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  isActive={editor.isActive("subscript")}
                  icon={<SubIcon className="h-3.5 w-3.5" />}
                  label="Subscript"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                  isActive={editor.isActive("superscript")}
                  icon={<SupIcon className="h-3.5 w-3.5" />}
                  label="Superscript"
                />

                <div className="w-px h-5 bg-[var(--editor-bubble-separator)] mx-0.5" />

                <BubbleBtn
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  isActive={editor.isActive({ textAlign: "left" })}
                  icon={<AlignLeft className="h-3.5 w-3.5" />}
                  label="Align Left"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                  isActive={editor.isActive({ textAlign: "center" })}
                  icon={<AlignCenter className="h-3.5 w-3.5" />}
                  label="Align Center"
                />
                <BubbleBtn
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  isActive={editor.isActive({ textAlign: "right" })}
                  icon={<AlignRight className="h-3.5 w-3.5" />}
                  label="Align Right"
                />

                <div className="w-px h-5 bg-[var(--editor-bubble-separator)] mx-0.5" />

                <BubbleBtn
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  isActive={editor.isActive("blockquote")}
                  icon={<Quote className="h-3.5 w-3.5" />}
                  label="Blockquote"
                />
                <BubbleBtn
                  onClick={handleCopy}
                  isActive={copied}
                  icon={
                    copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                  label="Copy"
                />
              </BubbleMenu>

              {/* Editor content */}
              <div className="relative">
                <EditorContent
                  editor={editor}
                  role="presentation"
                  className="clarify-editor-content min-h-[80vh] text-lg"
                />

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
            </EditorContext.Provider>

            {/* Hidden file input for image */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Created date footer */}
            {createdAt && (
              <div className="text-xs text-muted-foreground/60 mt-4 pt-3 border-t border-[var(--editor-border)]">
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

        {/* ── Mobile floating formatting toolbar (bottom-left) ── */}
        <div className="fixed bottom-6 left-4 z-40 md:hidden safe-area-inset-bottom">
          <div className="flex items-center gap-0.5 px-3 py-2 rounded-full bg-[var(--editor-bubble-bg)] border border-[var(--editor-bubble-border)] shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`p-2.5 rounded-full transition-colors ${
                editor.isActive("taskList") ? "text-[#E8613A] bg-[var(--editor-bubble-active)]" : "text-[var(--editor-text-muted)]"
              }`}
              aria-label="Checklist"
            >
              <CheckSquare className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleInsertImage}
              className="p-2.5 rounded-full text-[var(--editor-text-muted)] transition-colors"
              aria-label="Attach image"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleInsertDrawing}
              className="p-2.5 rounded-full text-[var(--editor-text-muted)] transition-colors"
              aria-label="Drawing"
            >
              <Pencil className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleLink}
              className={`p-2.5 rounded-full transition-colors ${
                editor.isActive("link") ? "text-[#E8613A] bg-[var(--editor-bubble-active)]" : "text-[var(--editor-text-muted)]"
              }`}
              aria-label="Insert link"
            >
              <LinkIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* ── Mobile new note button (bottom-right) ── */}
        <NextLink href="/notes/new" className="fixed bottom-6 right-4 z-40 md:hidden safe-area-inset-bottom">
          <div className="flex items-center justify-center px-3 py-2 rounded-full bg-[var(--editor-bubble-bg)] border border-[var(--editor-bubble-border)] shadow-2xl backdrop-blur-xl">
            <div className="p-2.5 rounded-full text-[#E8613A]">
              <SquarePen className="w-[18px] h-[18px]" />
            </div>
          </div>
        </NextLink>

        <DrawingModal
          isOpen={showDrawingModal}
          onClose={() => setShowDrawingModal(false)}
          onSave={handleSaveDrawing}
        />
      </div>
    </ProtectedRoute>
  );
}
