"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// --- Custom App Components ---
import { Button as ShadcnButton } from "@/components/ui/button";
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
  Link as LinkIcon,
  Image as ImageIcon,
  CheckSquare,
  X,
} from "lucide-react";

// --- Styles ---
import "./simple-editor.scss";

// ─────────────────────────────────────────────
// Local Storage Media Helper
// ─────────────────────────────────────────────
const MEDIA_STORAGE_KEY = "clarify_media_storage";

interface StoredMedia {
  id: string;
  type: "image";
  data: string;
  name: string;
  mimeType: string;
  createdAt: string;
}

function saveMediaToStorage(media: StoredMedia): void {
  try {
    const existing = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || "[]");
    existing.push(media);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save media to localStorage:", e);
  }
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface SimpleEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  createdAt?: string | null;
}

// ─────────────────────────────────────────────
// Toolbar Button
// ─────────────────────────────────────────────
function ToolbarBtn({
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
      className={`p-2 rounded transition-colors ${
        isActive
          ? "bg-[var(--editor-bubble-active)] text-[var(--editor-text)]"
          : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)] hover:bg-[var(--editor-bubble-hover)]"
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-[var(--editor-border)] mx-1" />;
}

// ─────────────────────────────────────────────
// Main Editor Component
// ─────────────────────────────────────────────
export function SimpleEditor({
  noteId,
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  createdAt = null,
}: SimpleEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "offline"
  >("idle");
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // Link popup state
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [hasSelectedText, setHasSelectedText] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // --- Refs ---
  const titleRef = useRef(title);
  const noteIdRef = useRef<string>((noteId ?? Date.now()).toString());
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      updateCounts();
    }
  }, [initialContent]);

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // ─────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────
  const getContent = useCallback(() => {
    return editorRef.current?.innerHTML || "";
  }, []);

  const updateCounts = useCallback(() => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  }, []);

  const checkActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  // ─────────────────────────────────────────────
  // Formatting commands
  // ─────────────────────────────────────────────
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveFormats();
  }, [checkActiveFormats]);

  const toggleBold = useCallback(() => execCommand("bold"), [execCommand]);
  const toggleItalic = useCallback(() => execCommand("italic"), [execCommand]);
  const toggleUnderline = useCallback(() => execCommand("underline"), [execCommand]);

  // ─────────────────────────────────────────────
  // Insert URL Link
  // ─────────────────────────────────────────────
  const openLinkPopup = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || "";

    // Save the current selection
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    setHasSelectedText(!!selectedText);
    setLinkText(selectedText);
    setLinkUrl("");
    setShowLinkPopup(true);

    // Focus the input after popup opens
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, []);

  const closeLinkPopup = useCallback(() => {
    setShowLinkPopup(false);
    setLinkUrl("");
    setLinkText("");
    setHasSelectedText(false);
    savedSelectionRef.current = null;
    editorRef.current?.focus();
  }, []);

  const applyLink = useCallback(() => {
    if (!linkUrl.trim()) {
      closeLinkPopup();
      return;
    }

    // Validate URL format
    let validUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl;
    }

    // Restore selection
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelectionRef.current);
    }

    if (hasSelectedText && savedSelectionRef.current) {
      // Wrap selected text with link
      document.execCommand("createLink", false, validUrl);
    } else {
      // Insert link with custom text or URL
      const displayText = linkText.trim() || validUrl;
      const link = document.createElement("a");
      link.href = validUrl;
      link.textContent = displayText;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(link);
        range.collapse(false);
      } else if (editorRef.current) {
        editorRef.current.appendChild(link);
      }
    }

    closeLinkPopup();
    handleContentChange();
  }, [linkUrl, linkText, hasSelectedText, closeLinkPopup]);

  const handleLinkKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeLinkPopup();
    }
  }, [applyLink, closeLinkPopup]);

  // ─────────────────────────────────────────────
  // Insert Todo Checkbox
  // ─────────────────────────────────────────────
  const insertTodo = useCallback(() => {
    if (!editorRef.current) return;

    const todoId = `todo_${Date.now()}`;
    const container = document.createElement("div");
    container.className = "todo-item";
    container.setAttribute("data-todo-id", todoId);

    container.innerHTML = `
      <label class="todo-checkbox-wrapper">
        <input type="checkbox" class="todo-checkbox" data-todo-id="${todoId}" />
        <span class="todo-checkmark"></span>
      </label>
      <span class="todo-text" contenteditable="true" data-todo-id="${todoId}">New task</span>
    `;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(container);
      range.collapse(false);
    } else {
      editorRef.current.appendChild(container);
    }

    // Focus the text
    const textEl = container.querySelector(".todo-text") as HTMLSpanElement;
    if (textEl) {
      textEl.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(textEl);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    // Handle checkbox change
    const checkbox = container.querySelector(".todo-checkbox") as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener("change", () => {
        container.classList.toggle("completed", checkbox.checked);
        handleContentChange();
      });
    }

    handleContentChange();
  }, []);

  // ─────────────────────────────────────────────
  // Auto-save draft (debounced 2s)
  // ─────────────────────────────────────────────
  const handleContentChange = useCallback(() => {
    updateCounts();
    checkActiveFormats();

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft({
        id: noteIdRef.current,
        title: titleRef.current.trim() || "Untitled",
        content: getContent(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);
  }, [createdAt, getContent, updateCounts, checkActiveFormats]);

  // Auto-save on title change
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft({
        id: noteIdRef.current,
        title: title.trim() || "Untitled",
        content: getContent(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 2000);
  }, [title, createdAt, getContent]);

  // Save draft on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft({
        id: noteIdRef.current,
        title: titleRef.current.trim() || "Untitled",
        content: getContent(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [createdAt, getContent]);

  // ─────────────────────────────────────────────
  // Explicit save (Ctrl+S)
  // ─────────────────────────────────────────────
  const handleExplicitSave = useCallback(async () => {
    if (!user?.uid) return;
    setSaveStatus("saving");
    const noteData = {
      id: noteIdRef.current,
      title: title.trim() || "Untitled",
      content: getContent(),
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
  }, [title, router, createdAt, user, getContent]);

  // Navigate back
  const handleBack = useCallback(async () => {
    if (user?.uid) {
      const noteData = {
        id: noteIdRef.current,
        title: titleRef.current.trim() || "Untitled",
        content: getContent(),
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveNoteOnLeave(user.uid, noteData);
    } else {
      clearDraft();
    }
    router.push("/notes");
  }, [router, user, createdAt, getContent]);

  // ─────────────────────────────────────────────
  // Media Handling
  // ─────────────────────────────────────────────
  const handleImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const mediaId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        saveMediaToStorage({
          id: mediaId,
          type: "image",
          data: dataUrl,
          name: file.name,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
        });

        const img = document.createElement("img");
        img.src = dataUrl;
        img.setAttribute("data-media-id", mediaId);
        img.className = "editor-image";

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.collapse(false);
        } else {
          editorRef.current?.appendChild(img);
        }

        handleContentChange();
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [handleContentChange]
  );

  // Drawing
  const handleSaveDrawing = useCallback(
    (imageDataUrl: string) => {
      if (!editorRef.current) return;

      const mediaId = `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveMediaToStorage({
        id: mediaId,
        type: "image",
        data: imageDataUrl,
        name: "drawing.png",
        mimeType: "image/png",
        createdAt: new Date().toISOString(),
      });

      const img = document.createElement("img");
      img.src = imageDataUrl;
      img.setAttribute("data-media-id", mediaId);
      img.className = "editor-image";

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
      } else {
        editorRef.current.appendChild(img);
      }

      handleContentChange();
    },
    [handleContentChange]
  );

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

  // Update active formats on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      checkActiveFormats();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [checkActiveFormats]);

  return (
    <ProtectedRoute>
      <div className="clarify-editor-page min-h-screen bg-[var(--editor-bg)]">
        <NavigationTabs activeTab="everything" onTabChange={() => {}} />
        <Sidebar />

        {/* ── Header ── */}
        <header
          className="fixed top-0 left-14 right-0 z-40 backdrop-blur-sm"
          style={{ background: "var(--editor-bg)" }}
        >
          <div className="relative h-12 flex items-center justify-between px-4">
            <ShadcnButton
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-7 w-7"
            >
              <ArrowLeft className="h-4 w-4" />
            </ShadcnButton>

            {/* Save status — center */}
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
            
          </div>
        </header>

        {/* ── Main content area ── */}
        <main className="ml-14 pt-16 pb-20">
          <div className="w-full px-12 lg:px-20">
            {/* Title */}
            <div className="mb-0">
              <input
                type="text"
                placeholder="Add Note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" || e.key === "Enter") {
                    e.preventDefault();
                    editorRef.current?.focus();
                  }
                }}
                className="text-[40px] font-semibold tracking-tight bg-transparent px-2 placeholder:text-[var(--editor-placeholder)] focus:outline-none py-1 w-full overflow-visible leading-tight text-[var(--editor-text)]"
              />
              <div className="h-px bg-[var(--editor-border)] mt-0.5" />
            </div>

            {/* ── Formatting Toolbar ── */}
            <div className="flex items-center gap-1 py-2 flex-wrap">
              {/* Text formatting */}
              <ToolbarBtn
                onClick={toggleBold}
                isActive={activeFormats.bold}
                icon={<Bold className="h-4 w-4" />}
                label="Bold (Ctrl+B)"
              />
              <ToolbarBtn
                onClick={toggleItalic}
                isActive={activeFormats.italic}
                icon={<Italic className="h-4 w-4" />}
                label="Italic (Ctrl+I)"
              />
              <ToolbarBtn
                onClick={toggleUnderline}
                isActive={activeFormats.underline}
                icon={<UnderlineIcon className="h-4 w-4" />}
                label="Underline (Ctrl+U)"
              />

              <ToolbarSeparator />

              {/* Todo */}
              <ToolbarBtn
                onClick={insertTodo}
                isActive={false}
                icon={<CheckSquare className="h-4 w-4" />}
                label="Insert Todo"
              />

              <ToolbarSeparator />

              {/* URL Link */}
              <div className="relative">
                <ToolbarBtn
                  onClick={openLinkPopup}
                  isActive={showLinkPopup}
                  icon={<LinkIcon className="h-4 w-4" />}
                  label="Insert Link"
                />

                {/* Link Popup */}
                {showLinkPopup && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[var(--editor-bg)] border border-[var(--editor-border)] rounded-lg shadow-lg p-3 min-w-[280px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--editor-text)]">
                        {hasSelectedText ? "Add link to selection" : "Insert link"}
                      </span>
                      <button
                        onClick={closeLinkPopup}
                        className="p-1 rounded hover:bg-[var(--editor-bubble-hover)] text-[var(--editor-text-muted)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {!hasSelectedText && (
                      <div className="mb-2">
                        <label className="block text-xs text-[var(--editor-text-muted)] mb-1">
                          Link text
                        </label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          onKeyDown={handleLinkKeyDown}
                          placeholder="Display text"
                          className="w-full px-2 py-1.5 text-sm border border-[var(--editor-border)] rounded bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="block text-xs text-[var(--editor-text-muted)] mb-1">
                        URL
                      </label>
                      <input
                        ref={linkInputRef}
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={handleLinkKeyDown}
                        placeholder="https://example.com"
                        className="w-full px-2 py-1.5 text-sm border border-[var(--editor-border)] rounded bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={closeLinkPopup}
                        className="px-3 py-1.5 text-sm text-[var(--editor-text-muted)] hover:text-[var(--editor-text)] rounded hover:bg-[var(--editor-bubble-hover)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={applyLink}
                        disabled={!linkUrl.trim()}
                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <ToolbarSeparator />

              {/* Image */}
              <ToolbarBtn
                onClick={handleImageUpload}
                isActive={false}
                icon={<ImageIcon className="h-4 w-4" />}
                label="Insert Image"
              />
            </div>

            {/* ── ContentEditable Editor ── */}
            <div
              ref={editorRef}
              contentEditable
              className="simple-editor-content min-h-[80vh] text-lg p-4 focus:outline-none prose prose-neutral dark:prose-invert max-w-none"
              onInput={handleContentChange}
              onKeyUp={checkActiveFormats}
              onMouseUp={checkActiveFormats}
              suppressContentEditableWarning
              data-placeholder="Start writing..."
            />

            {/* Hidden file input */}
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

        <DrawingModal
          isOpen={showDrawingModal}
          onClose={() => setShowDrawingModal(false)}
          onSave={handleSaveDrawing}
        />
      </div>
    </ProtectedRoute>
  );
}
