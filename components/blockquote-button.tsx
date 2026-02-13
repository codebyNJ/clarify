"use client";

import { Editor } from "@tiptap/react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockquoteButtonProps {
  editor: Editor | null;
  className?: string;
}

export function BlockquoteButton({ editor, className }: BlockquoteButtonProps) {
  if (!editor) return null;

  const isActive = editor.isActive("blockquote");

  return (
    <button
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      className={cn(
        "p-1.5 rounded hover:bg-accent transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        className
      )}
      title="Blockquote"
    >
      <Quote className="h-4 w-4" />
    </button>
  );
}
