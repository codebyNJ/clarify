"use client";

import { Editor } from "@tiptap/react";
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
  Type,
  Code,
  Smile,
  Table,
  Minus,
  ListCollapse,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
        action: (editor: Editor) => editor.chain().focus().setParagraph().run(),
      },
      {
        id: "heading1",
        label: "Heading 1",
        icon: <Heading1 className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "heading2",
        label: "Heading 2",
        icon: <Heading2 className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "heading3",
        label: "Heading 3",
        icon: <Heading3 className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "bulletList",
        label: "Bullet List",
        icon: <List className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: "orderedList",
        label: "Numbered List",
        icon: <ListOrdered className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "taskList",
        label: "To-do list",
        icon: <CheckSquare className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
      },
      {
        id: "blockquote",
        label: "Blockquote",
        icon: <Quote className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "codeBlock",
        label: "Code Block",
        icon: <Code className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
      },
    ],
  },
  {
    title: "Insert",
    commands: [
      {
        id: "uploadImage",
        label: "Upload image",
        icon: <ImagePlus className="w-4 h-4" />,
        action: (editor: Editor) =>
          editor.chain().focus().insertContent({ type: "imageUpload" }).run(),
      },
      {
        id: "emoji",
        label: "Emoji",
        icon: <Smile className="w-4 h-4" />,
        action: (editor: Editor) => {
          const emojis = ["😊", "👍", "❤️", "🎉", "✨", "🔥", "👀", "💡", "🚀", "📝"];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          editor.chain().focus().insertContent(randomEmoji).run();
        },
      },
      {
        id: "table",
        label: "Table",
        icon: <Table className="w-4 h-4" />,
        action: (editor: Editor) => {
          editor.chain().focus().insertContent(`
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`).run();
        },
      },
      {
        id: "separator",
        label: "Separator",
        icon: <Minus className="w-4 h-4" />,
        action: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        id: "tableOfContents",
        label: "Table of contents",
        icon: <ListCollapse className="w-4 h-4" />,
        action: (editor: Editor) => {
          editor.chain().focus().insertContent(`
## Table of Contents

1. [Introduction](#introduction)
2. [Main Content](#main-content)
3. [Conclusion](#conclusion)

---

### Introduction

### Main Content

### Conclusion
`).run();
        },
      },
    ],
  },
];

export function SlashCommandMenu({
  editor,
  position,
  onClose,
}: SlashCommandMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredSections = commandSections
    .map((section) => ({
      ...section,
      commands: section.commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.commands.length > 0);

  const filteredCommands = filteredSections.flatMap((section) => section.commands);

  const handleCommandSelect = useCallback(
    (command: CommandItem) => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
      const slashIndex = textBefore.lastIndexOf("/");

      if (slashIndex !== -1) {
        const deleteFrom = from - (textBefore.length - slashIndex);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }

      command.action(editor);
      onClose();
    },
    [editor, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommandSelect(filteredCommands[selectedIndex]);
        }
      } else if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, selectedIndex, handleCommandSelect, onClose]);

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
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="slash-command-menu absolute z-50 w-72 bg-popover dark:bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden border border-border dark:border-white/10"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="slash-command-scroll max-h-80 overflow-y-auto py-2">
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
