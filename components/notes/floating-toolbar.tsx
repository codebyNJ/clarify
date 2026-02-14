"use client";

import { type Editor } from "@tiptap/react";
import { useState, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Quote,
  Highlighter,
  Code,
  Copy,
  Check,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface FloatingToolbarProps {
  editor: Editor;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const { state } = editor;
      const { selection } = state;

      if (selection.empty) {
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

  const handleCopy = useCallback(async () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editor]);

  const handleLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  }, [editor]);

  if (!isVisible || !position) return null;

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
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={<Bold className="h-3.5 w-3.5" />}
        label="Bold"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={<Italic className="h-3.5 w-3.5" />}
        label="Italic"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        icon={<UnderlineIcon className="h-3.5 w-3.5" />}
        label="Underline"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        icon={<Strikethrough className="h-3.5 w-3.5" />}
        label="Strikethrough"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        icon={<Subscript className="h-3.5 w-3.5" />}
        label="Subscript"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        icon={<Superscript className="h-3.5 w-3.5" />}
        label="Superscript"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        icon={<AlignLeft className="h-3.5 w-3.5" />}
        label="Align Left"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        icon={<AlignCenter className="h-3.5 w-3.5" />}
        label="Align Center"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        icon={<AlignRight className="h-3.5 w-3.5" />}
        label="Align Right"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={<Quote className="h-3.5 w-3.5" />}
        label="Blockquote"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        icon={<Highlighter className="h-3.5 w-3.5" />}
        label="Highlight"
      />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        icon={<Code className="h-3.5 w-3.5" />}
        label="Code"
      />
      <ToolbarBtn
        onClick={handleCopy}
        isActive={copied}
        icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        label="Copy"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn
        onClick={handleLink}
        isActive={editor.isActive("link")}
        icon={<LinkIcon className="h-3.5 w-3.5" />}
        label="Link"
      />
    </div>
  );
}

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
      className={`p-1.5 rounded hover:bg-accent transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
