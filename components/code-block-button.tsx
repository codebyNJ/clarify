"use client";

import { Editor } from "@tiptap/react";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockButtonProps {
  editor: Editor | null;
  className?: string;
}

export function CodeBlockButton({ editor, className }: CodeBlockButtonProps) {
  if (!editor) return null;

  const isActive = editor.isActive("codeBlock");

  return (
    <button
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      className={cn(
        "p-1.5 rounded hover:bg-accent transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        className
      )}
      title="Code Block"
    >
      <Code className="h-4 w-4" />
    </button>
  );
}
