"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";

// ─────────────────────────────────────────────
// HTML Sanitization Config
// ─────────────────────────────────────────────
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "b", "i", "u", "strong", "em", "span", "div",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "code", "pre",
    "a", "img", "hr", "table", "thead", "tbody", "tr", "th", "td",
    "input", "label", "font"
  ],
  ALLOWED_ATTR: [
    "href", "src", "alt", "title", "class", "style", "target", "rel",
    "data-media-id", "data-todo-id", "data-placeholder",
    "type", "checked", "contenteditable"
  ],
  ALLOW_DATA_ATTR: true,
  ADD_ATTR: ["target"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

// --- Custom App Components ---
import { Button as ShadcnButton } from "@/components/ui/button";
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
  Highlighter,
} from "lucide-react";

// ─────────────────────────────────────────────
// Highlight Colors
// ─────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { name: "None", color: "transparent" },
  { name: "Charcoal", color: "#2d2d2d" },
  { name: "Grey", color: "#3d3d3d" },
  { name: "Brown", color: "#4a3728" },
  { name: "Rust", color: "#6b3d2e" },
  { name: "Olive", color: "#4a4a28" },
  { name: "Teal", color: "#1e3a3a" },
  { name: "Navy", color: "#1e2a4a" },
  { name: "Purple", color: "#3a2a4a" },
  { name: "Plum", color: "#4a2a3a" },
  { name: "Maroon", color: "#4a2a2a" },
];

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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  // Link popup state
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [hasSelectedText, setHasSelectedText] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Highlight popup state
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const highlightSelectionRef = useRef<Range | null>(null);

  // --- Refs ---
  const titleRef = useRef(title);
  const noteIdRef = useRef<string>((noteId ?? Date.now()).toString());
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Set initial content (sanitized)
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = sanitizeHTML(initialContent);
      updateCounts();
    }
  }, [initialContent]);

  // Update title when initialTitle changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

    // Security: Validate URL and block dangerous protocols
    let validUrl = linkUrl.trim();

    // Block dangerous protocols (javascript:, data:, vbscript:, etc.)
    const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
    if (dangerousProtocols.test(validUrl)) {
      console.warn("Blocked potentially dangerous URL protocol");
      closeLinkPopup();
      return;
    }

    // Add https:// if no protocol specified
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl;
    }

    // Validate URL format
    try {
      new URL(validUrl);
    } catch {
      console.warn("Invalid URL format");
      closeLinkPopup();
      return;
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
  // Text Highlighting
  // ─────────────────────────────────────────────
  const openHighlightPopup = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return; // No text selected
    }

    // Save the current selection
    highlightSelectionRef.current = selection.getRangeAt(0).cloneRange();
    setShowHighlightPopup(true);
  }, []);

  const closeHighlightPopup = useCallback(() => {
    setShowHighlightPopup(false);
    highlightSelectionRef.current = null;
    editorRef.current?.focus();
  }, []);

  const applyHighlight = useCallback((color: string) => {
    if (!highlightSelectionRef.current) {
      closeHighlightPopup();
      return;
    }

    // Restore selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(highlightSelectionRef.current);

    if (color === "transparent") {
      // Remove highlight
      document.execCommand("removeFormat", false);
    } else {
      // Apply highlight color
      document.execCommand("hiliteColor", false, color);
    }

    closeHighlightPopup();
    handleContentChange();
  }, [closeHighlightPopup]);

  // ─────────────────────────────────────────────
  // Insert Todo Checkbox
  // ─────────────────────────────────────────────
  const insertTodo = useCallback(() => {
    if (!editorRef.current) return;

    const todoId = `todo_${Date.now()}`;

    // Create todo using execCommand for better integration
    const todoHtml = `<div class="todo-item" data-todo-id="${todoId}"><label class="todo-checkbox-wrapper"><input type="checkbox" class="todo-checkbox" data-todo-id="${todoId}" /><span class="todo-checkmark"></span></label><span class="todo-text" data-todo-id="${todoId}">New task</span></div><p><br></p>`;

    document.execCommand("insertHTML", false, todoHtml);

    // Find and focus the new todo text
    const newTodo = editorRef.current.querySelector(`[data-todo-id="${todoId}"] .todo-text`) as HTMLSpanElement;
    if (newTodo) {
      const range = document.createRange();
      range.selectNodeContents(newTodo);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    handleContentChange();
  }, []);

  // Handle todo checkbox clicks via event delegation
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Handle checkbox clicks
      if (target.classList.contains("todo-checkbox")) {
        const checkbox = target as HTMLInputElement;
        const todoItem = checkbox.closest(".todo-item");
        if (todoItem) {
          // Toggle completed class based on checkbox state
          setTimeout(() => {
            todoItem.classList.toggle("completed", checkbox.checked);
            handleContentChange();
          }, 0);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const todoText = (range.startContainer as HTMLElement).closest?.(".todo-text") ||
                       (range.startContainer.parentElement as HTMLElement)?.closest?.(".todo-text");

      if (todoText && e.key === "Backspace") {
        const text = todoText.textContent || "";
        // If todo text is empty or cursor at start, remove the todo item
        if (text.length === 0 || (range.startOffset === 0 && range.collapsed)) {
          const todoItem = todoText.closest(".todo-item");
          if (todoItem && text.length === 0) {
            e.preventDefault();
            todoItem.remove();
            handleContentChange();
          }
        }
      }

      // Enter key creates new paragraph, not new todo
      if (todoText && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const todoItem = todoText.closest(".todo-item");
        if (todoItem) {
          const p = document.createElement("p");
          p.innerHTML = "<br>";
          todoItem.after(p);

          // Move cursor to new paragraph
          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        handleContentChange();
      }
    };

    editor.addEventListener("click", handleClick);
    editor.addEventListener("keydown", handleKeyDown);

    return () => {
      editor.removeEventListener("click", handleClick);
      editor.removeEventListener("keydown", handleKeyDown);
    };
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
        {/* Only show NavigationTabs and Sidebar on desktop */}
        {!isMobile && (
          <>
            <NavigationTabs activeTab="everything" onTabChange={() => {}} />
            <Sidebar />
          </>
        )}

        {/* ── Header ── */}
        <header
          className={`fixed top-0 right-0 z-40 backdrop-blur-sm ${isMobile ? "left-0" : "left-14"}`}
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
        <main className={`${isMobile ? "pt-20 ml-0 pb-28" : "pt-16 ml-14 pb-20"}`}>
          <div className={`w-full ${isMobile ? "px-6" : "px-12 lg:px-20"}`}>
            {/* Title */}
            <div className={`${isMobile ? "mb-2 pt-2" : "mb-0"}`}>
              <input
                type="text"
                placeholder={isMobile ? "Title" : "Add Note"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" || e.key === "Enter") {
                    e.preventDefault();
                    editorRef.current?.focus();
                  }
                }}
                className={`font-semibold tracking-tight bg-transparent placeholder:text-[var(--editor-placeholder)] focus:outline-none w-full overflow-visible text-[var(--editor-text)] ${
                  isMobile
                    ? "text-[28px] leading-tight py-0"
                    : "text-[40px] px-2 py-1 leading-tight"
                }`}
              />
              {!isMobile && <div className="h-px bg-[var(--editor-border)] mt-0.5" />}
            </div>

            {/* ── Formatting Toolbar (Desktop only) ── */}
            {!isMobile && (
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

              {/* Highlight */}
              <div className="relative">
                <ToolbarBtn
                  onClick={openHighlightPopup}
                  isActive={showHighlightPopup}
                  icon={<Highlighter className="h-4 w-4" />}
                  label="Highlight Text"
                />

                {/* Highlight Color Popup */}
                {showHighlightPopup && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[var(--editor-bg)] border border-[var(--editor-border)] rounded-lg shadow-lg p-2 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-medium text-[var(--editor-text)]">
                        Highlight Color
                      </span>
                      <button
                        onClick={closeHighlightPopup}
                        className="p-0.5 rounded hover:bg-[var(--editor-bubble-hover)] text-[var(--editor-text-muted)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {HIGHLIGHT_COLORS.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => applyHighlight(item.color)}
                          title={item.name}
                          className="w-7 h-7 rounded-md border border-[var(--editor-border)] hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: item.color === "transparent" ? "var(--editor-bg)" : item.color,
                            backgroundImage: item.color === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)" : "none",
                            backgroundSize: item.color === "transparent" ? "6px 6px" : "auto",
                            backgroundPosition: item.color === "transparent" ? "0 0, 3px 3px" : "auto",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Todo */}
              <ToolbarBtn
                onClick={insertTodo}
                isActive={false}
                icon={<CheckSquare className="h-4 w-4" />}
                label="Insert Todo"
              />


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
                          className="w-full px-2 py-1.5 text-sm border border-[var(--editor-border)] rounded bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-[#E8613A]"
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
                        className="w-full px-2 py-1.5 text-sm border border-[var(--editor-border)] rounded bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-[#E8613A]"
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
                        className="px-3 py-1.5 text-sm bg-[#E8613A] text-white rounded hover:bg-[#d4552f] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image */}
              <ToolbarBtn
                onClick={handleImageUpload}
                isActive={false}
                icon={<ImageIcon className="h-4 w-4" />}
                label="Insert Image"
              />
            </div>
            )}

            {/* ── ContentEditable Editor ── */}
            <div
              ref={editorRef}
              contentEditable
              className={`simple-editor-content focus:outline-none prose prose-neutral dark:prose-invert max-w-none ${
                isMobile
                  ? "min-h-[85vh] text-[17px] leading-relaxed pt-2"
                  : "min-h-[80vh] text-lg p-4"
              }`}
              onInput={handleContentChange}
              onKeyUp={checkActiveFormats}
              onMouseUp={checkActiveFormats}
              suppressContentEditableWarning
              data-placeholder={isMobile ? "Start typing..." : "Start writing..."}
            />

            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </div>
        </main>

        {/* ── Mobile Floating Toolbar ── */}
        {isMobile && (
          <>
            {/* Floating trigger button */}
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className="fixed bottom-6 left-4 z-50 w-12 h-12 bg-[#E8613A] rounded-full flex items-center justify-center shadow-lg"
            >
              <Bold className="h-5 w-5 text-white" />
            </button>

            {/* Floating toolbar popup */}
            {showMobileToolbar && (
              <div className="fixed bottom-20 left-4 z-50 bg-[var(--editor-bg)] border border-[var(--editor-border)] rounded-xl shadow-xl p-2 flex flex-col gap-1">
                {/* Close button */}
                <button
                  onClick={() => setShowMobileToolbar(false)}
                  className="self-end p-1 mb-1 text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Format buttons grid */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => { toggleBold(); }}
                    className={`p-3 rounded-lg transition-colors ${activeFormats.bold ? "bg-[#E8613A] text-white" : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"}`}
                  >
                    <Bold className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { toggleItalic(); }}
                    className={`p-3 rounded-lg transition-colors ${activeFormats.italic ? "bg-[#E8613A] text-white" : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"}`}
                  >
                    <Italic className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { toggleUnderline(); }}
                    className={`p-3 rounded-lg transition-colors ${activeFormats.underline ? "bg-[#E8613A] text-white" : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"}`}
                  >
                    <UnderlineIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { openHighlightPopup(); setShowMobileToolbar(false); }}
                    className="p-3 rounded-lg text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"
                  >
                    <Highlighter className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { insertTodo(); setShowMobileToolbar(false); }}
                    className="p-3 rounded-lg text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"
                  >
                    <CheckSquare className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { openLinkPopup(); setShowMobileToolbar(false); }}
                    className="p-3 rounded-lg text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { handleImageUpload(); setShowMobileToolbar(false); }}
                    className="p-3 rounded-lg text-[var(--editor-text-muted)] hover:bg-[var(--editor-bubble-hover)]"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mobile Highlight Popup */}
        {isMobile && showHighlightPopup && (
          <div className="fixed bottom-20 left-4 z-50 bg-[var(--editor-bg)] border border-[var(--editor-border)] rounded-xl shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--editor-text)]">Highlight</span>
              <button
                onClick={closeHighlightPopup}
                className="p-1 text-[var(--editor-text-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {HIGHLIGHT_COLORS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => applyHighlight(item.color)}
                  className="w-8 h-8 rounded-lg border border-[var(--editor-border)]"
                  style={{
                    backgroundColor: item.color === "transparent" ? "var(--editor-bg)" : item.color,
                    backgroundImage: item.color === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)" : "none",
                    backgroundSize: item.color === "transparent" ? "6px 6px" : "auto",
                    backgroundPosition: item.color === "transparent" ? "0 0, 3px 3px" : "auto",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mobile Link Popup */}
        {isMobile && showLinkPopup && (
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-[var(--editor-bg)] border border-[var(--editor-border)] rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--editor-text)]">
                {hasSelectedText ? "Add link to selection" : "Insert link"}
              </span>
              <button onClick={closeLinkPopup} className="p-1 text-[var(--editor-text-muted)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!hasSelectedText && (
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
                className="w-full px-3 py-2 mb-2 text-sm border border-[var(--editor-border)] rounded-lg bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-[#E8613A]"
              />
            )}

            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 mb-3 text-sm border border-[var(--editor-border)] rounded-lg bg-transparent text-[var(--editor-text)] placeholder:text-[var(--editor-placeholder)] focus:outline-none focus:border-[#E8613A]"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={closeLinkPopup}
                className="flex-1 py-2 text-sm text-[var(--editor-text-muted)] border border-[var(--editor-border)] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                disabled={!linkUrl.trim()}
                className="flex-1 py-2 text-sm bg-[#E8613A] text-white rounded-lg disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
