"use client";

import { type Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Pencil,
  Table as TableIcon,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface SlashCommandMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  onClose: () => void;
  onInsertImage: () => void;
  onInsertDrawing: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
}

interface CommandSection {
  title: string;
  commands: CommandItem[];
}

const commandSections: CommandSection[] = [
  {
    title: "Style",
    commands: [
      {
        id: "paragraph",
        label: "Text",
        icon: <span className="text-sm font-serif">T</span>,
        action: (editor) => editor.chain().focus().setParagraph().run(),
      },
      {
        id: "heading1",
        label: "Heading 1",
        icon: <Heading1 className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "heading2",
        label: "Heading 2",
        icon: <Heading2 className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "heading3",
        label: "Heading 3",
        icon: <Heading3 className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "bulletList",
        label: "Bullet List",
        icon: <List className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: "orderedList",
        label: "Numbered List",
        icon: <ListOrdered className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "taskList",
        label: "To-do list",
        icon: <CheckSquare className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleTaskList().run(),
      },
      {
        id: "blockquote",
        label: "Blockquote",
        icon: <Quote className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "codeBlock",
        label: "Code Block",
        icon: <Code className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      },
    ],
  },
  {
    title: "Insert",
    commands: [
      {
        id: "table",
        label: "Table",
        icon: <TableIcon className="w-4 h-4" />,
        action: (editor) =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        id: "image",
        label: "Image",
        icon: <ImagePlus className="w-4 h-4" />,
        action: () => {},
      },
      {
        id: "drawing",
        label: "Drawing",
        icon: <Pencil className="w-4 h-4" />,
        action: () => {},
      },
      {
        id: "separator",
        label: "Separator",
        icon: <Minus className="w-4 h-4" />,
        action: (editor) => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
  },
];

export function SlashCommandMenu({
  editor,
  position,
  onClose,
  onInsertImage,
  onInsertDrawing,
}: SlashCommandMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredSections = commandSections
    .map((section) => ({
      ...section,
      commands: section.commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.commands.length > 0);

  const filteredCommands = filteredSections.flatMap((section) => section.commands);

  const deleteSlashText = useCallback(() => {
    const { state } = editor;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
    const slashIndex = textBefore.lastIndexOf("/");

    if (slashIndex !== -1) {
      const deleteFrom = from - (textBefore.length - slashIndex);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
  }, [editor]);

  const handleCommandSelect = useCallback(
    (command: CommandItem) => {
      deleteSlashText();

      if (command.id === "image") {
        onInsertImage();
      } else if (command.id === "drawing") {
        onInsertDrawing();
      } else {
        command.action(editor);
      }
      onClose();
    },
    [editor, onClose, onInsertImage, onInsertDrawing, deleteSlashText]
  );

  // Keyboard handler in CAPTURE phase so it fires before ProseMirror
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        if (filteredCommands[selectedIndex]) {
          handleCommandSelect(filteredCommands[selectedIndex]);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Use capture phase (third arg = true) so we intercept before ProseMirror
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filteredCommands, selectedIndex, handleCommandSelect, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return;
    const selectedEl = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const { state } = editor;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
    const slashIndex = textBefore.lastIndexOf("/");

    if (slashIndex !== -1) {
      const search = textBefore.substring(slashIndex + 1);
      setSearchTerm(search);
      setSelectedIndex(0);
    }
  }, [editor]);

  const getGlobalIndex = (sectionIndex: number, commandIndex: number): number => {
    let count = 0;
    for (let i = 0; i < sectionIndex; i++) {
      count += filteredSections[i].commands.length;
    }
    return count + commandIndex;
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="slash-command-menu absolute z-50 w-72 bg-popover dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-border dark:border-white/10 max-h-80 overflow-y-auto py-2"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {filteredSections.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No commands found
          </div>
        ) : (
          filteredSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground dark:text-gray-400">
                {section.title}
              </div>
              {section.commands.map((command, commandIndex) => {
                const globalIndex = getGlobalIndex(sectionIndex, commandIndex);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <button
                    key={command.id}
                    data-index={globalIndex}
                    onClick={() => handleCommandSelect(command)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-muted dark:bg-white/10 text-foreground dark:text-white"
                        : "text-foreground dark:text-gray-300 hover:bg-muted/70 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 text-muted-foreground dark:text-gray-400">
                      {command.icon}
                    </div>
                    <span className="text-sm">{command.label}</span>
                  </button>
                );
              })}
              {sectionIndex < filteredSections.length - 1 && (
                <div className="mx-3 mt-2 border-t border-border dark:border-white/10" />
              )}
            </div>
          ))
        )}
      </motion.div>
    </AnimatePresence>
  );
}
