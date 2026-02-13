"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Highlighter, ChevronDown, X } from "lucide-react";

interface HighlightColor {
  name: string;
  color: string;
  cssVar: string;
}

interface ColorHighlightPopoverProps {
  editor: Editor;
  hideWhenUnavailable?: boolean;
  onApplied?: ({ color, label }: { color: string; label: string }) => void;
}

const defaultColors: HighlightColor[] = [
  { name: "Yellow", color: "#fef08a", cssVar: "var(--tt-color-highlight-yellow)" },
  { name: "Green", color: "#bbf7d0", cssVar: "var(--tt-color-highlight-green)" },
  { name: "Blue", color: "#bfdbfe", cssVar: "var(--tt-color-highlight-blue)" },
  { name: "Pink", color: "#fbcfe8", cssVar: "var(--tt-color-highlight-pink)" },
  { name: "Orange", color: "#fed7aa", cssVar: "var(--tt-color-highlight-orange)" },
  { name: "Purple", color: "#e9d5ff", cssVar: "var(--tt-color-highlight-purple)" },
  { name: "Red", color: "#fecaca", cssVar: "var(--tt-color-highlight-red)" },
  { name: "Gray", color: "#e5e7eb", cssVar: "var(--tt-color-highlight-gray)" },
];

export function ColorHighlightPopover({
  editor,
  hideWhenUnavailable = false,
  onApplied,
}: ColorHighlightPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = editor.isActive("highlight");

  // Check if highlight is available (text is selected)
  const { empty } = editor.state.selection;
  const isUnavailable = empty;

  if (hideWhenUnavailable && isUnavailable) {
    return null;
  }

  const handleColorSelect = (color: HighlightColor) => {
    editor.chain().focus().toggleHighlight({ color: color.color }).run();
    setIsOpen(false);
    onApplied?.({ color: color.color, label: color.name });
  };

  const handleRemove = () => {
    editor.chain().focus().toggleHighlight().run();
    setIsOpen(false);
    onApplied?.({ color: "", label: "Remove" });
  };

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={togglePopover}
        disabled={isUnavailable}
        className={`flex items-center gap-0.5 p-1.5 rounded hover:bg-accent transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        } ${isUnavailable ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Highlight text"
      >
        <Highlighter className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Highlight
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Color palette */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {defaultColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorSelect(color)}
                  className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color.color,
                    borderColor: "transparent",
                  }}
                  title={color.name}
                />
              ))}
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded text-left flex items-center gap-2 transition-colors"
            >
              <span className="w-4 h-px bg-muted-foreground" />
              Remove highlight
            </button>
          </div>
        </>
      )}
    </div>
  );
}
