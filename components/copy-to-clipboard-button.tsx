"use client";

import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CopyToClipboardButtonProps {
  editor: Editor | null;
  text?: string;
  copyWithFormatting?: boolean;
  hideWhenUnavailable?: boolean;
  onCopied?: () => void;
  showShortcut?: boolean;
}

export function CopyToClipboardButton({
  editor,
  text,
  copyWithFormatting = true,
  hideWhenUnavailable = false,
  onCopied,
  showShortcut = false,
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!editor) return;

    try {
      if (copyWithFormatting) {
        // Copy with HTML formatting
        const html = editor.getHTML();
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([editor.getText()], { type: "text/plain" });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        // Copy plain text only
        await navigator.clipboard.writeText(editor.getText());
      }

      setCopied(true);
      onCopied?.();

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      
      // Fallback for browsers that don't support Clipboard API
      try {
        const textToCopy = copyWithFormatting ? editor.getText() : editor.getText();
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
    }
  }, [editor, copyWithFormatting, onCopied]);

  // Check if button should be hidden
  if (hideWhenUnavailable && !editor) {
    return null;
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground ${
        copied ? "text-green-600" : ""
      }`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {text && <span className="text-xs">{text}</span>}
      {showShortcut && (
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          Ctrl+C
        </kbd>
      )}
    </button>
  );
}
