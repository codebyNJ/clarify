"use client";

import { Editor } from "@tiptap/react";
import { Highlighter } from "lucide-react";

interface ColorHighlightButtonProps {
  editor: Editor;
  highlightColor?: string;
  tooltip?: string;
}

const defaultColors = [
  { name: "Yellow", color: "#fef08a", border: "#eab308" },
  { name: "Green", color: "#bbf7d0", border: "#22c55e" },
  { name: "Blue", color: "#bfdbfe", border: "#3b82f6" },
  { name: "Pink", color: "#fbcfe8", border: "#ec4899" },
  { name: "Orange", color: "#fed7aa", border: "#f97316" },
  { name: "Purple", color: "#e9d5ff", border: "#a855f7" },
  { name: "Red", color: "#fecaca", border: "#ef4444" },
  { name: "Gray", color: "#e5e7eb", border: "#6b7280" },
];

export function ColorHighlightButton({
  editor,
  highlightColor,
  tooltip = "Highlight",
}: ColorHighlightButtonProps) {
  const isActive = editor.isActive("highlight");

  const handleHighlight = () => {
    // Toggle highlight - toggleHighlight is the correct API
    editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run();
  };

  const handleColorSelect = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const handleRemove = () => {
    editor.chain().focus().toggleHighlight().run();
  };

  return (
    <div className="relative group">
      <button
        onClick={handleHighlight}
        className={`p-1.5 rounded hover:bg-accent transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        }`}
        title={tooltip}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      {/* Color palette dropdown */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50">
        <div className="text-xs text-muted-foreground mb-1 px-1">Highlight</div>
        <div className="flex gap-1 flex-wrap max-w-[120px]">
          {defaultColors.map(({ name, color, border }) => (
            <button
              key={name}
              onClick={() => handleColorSelect(color)}
              className="w-5 h-5 rounded border-2 hover:scale-110 transition-transform"
              style={{ backgroundColor: color, borderColor: border }}
              title={name}
            />
          ))}
        </div>
        <button
          onClick={handleRemove}
          className="text-xs text-muted-foreground hover:text-foreground mt-1 px-1 py-0.5 text-left"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
