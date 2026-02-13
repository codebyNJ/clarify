"use client"

import type React from "react"
import { useState, useCallback, useMemo, useTransition, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import NavigationTabs from "@/components/navigation-tabs"
import SearchInput from "@/components/search-input"
import Sidebar from "@/components/sidebar"
import NoteCard from "@/components/note-card"
import NoteEditor from "@/components/note-editor"
import NoteViewer from "@/components/note-viewer"
import ExcalidrawModal from "@/components/excalidraw-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import ProtectedRoute from "@/components/protected-route"
import { parseMarkdown } from "@/lib/markdown-parser"
import { useDebounce } from "@/lib/hooks"
import type { SlashCommand } from "@/lib/types"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Sparkles,
  Hash,
  List,
  Quote,
  Code,
  Bold,
  Italic,
  CheckSquare,
  ImageIcon,
  Link,
  Minus,
  Calendar,
  Tag,
  PenTool,
} from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
}

interface Space {
  id: number
  name: string
  color: string
  noteIds: number[]
}

export default function MyMindApp() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [notesLayout, setNotesLayout] = useState<"2" | "3" | "4">("4")
  const [activeTab, setActiveTab] = useState<"everything" | "spaces" | "serendipity">("everything")

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes)
        setNotes(parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
        })))
      } catch (e) {
        console.error("Failed to parse notes:", e)
      }
    }
  }, [])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: "", content: "" })

  // Editor states
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Drawing states
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false)
  const [currentDrawingData, setCurrentDrawingData] = useState<string>("")
  const [editingDrawingData, setEditingDrawingData] = useState<string>("")
  const [isEditingExistingDrawing, setIsEditingExistingDrawing] = useState(false)

  // Delete confirmation modal state
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null)

  const [spaces] = useState<Space[]>([])
  const [isPending, startTransition] = useTransition()

  const debouncedSearchQuery = useDebounce(searchQuery, 100)

  const slashCommands: SlashCommand[] = useMemo(
    () => [
      {
        id: "heading1",
        label: "Heading 1",
        icon: <Hash className="w-4 h-4" />,
        action: "# ",
        description: "Large heading",
      },
      {
        id: "heading2",
        label: "Heading 2",
        icon: <Hash className="w-4 h-4" />,
        action: "## ",
        description: "Medium heading",
      },
      {
        id: "heading3",
        label: "Heading 3",
        icon: <Hash className="w-4 h-4" />,
        action: "### ",
        description: "Small heading",
      },
      {
        id: "bold",
        label: "Bold",
        icon: <Bold className="w-4 h-4" />,
        action: "**bold text**",
        description: "Make text bold",
      },
      {
        id: "italic",
        label: "Italic",
        icon: <Italic className="w-4 h-4" />,
        action: "*italic text*",
        description: "Make text italic",
      },
      {
        id: "list",
        label: "Bullet List",
        icon: <List className="w-4 h-4" />,
        action: "- ",
        description: "Create a list",
      },
      {
        id: "todo",
        label: "To-Do List",
        icon: <CheckSquare className="w-4 h-4" />,
        action: "- [ ] ",
        description: "Create a to-do item",
      },
      {
        id: "todo-done",
        label: "Done Item",
        icon: <CheckSquare className="w-4 h-4" />,
        action: "- [x] ",
        description: "Create a completed to-do",
      },
      {
        id: "quote",
        label: "Quote",
        icon: <Quote className="w-4 h-4" />,
        action: "> ",
        description: "Add a quote",
      },
      {
        id: "code",
        label: "Code",
        icon: <Code className="w-4 h-4" />,
        action: "`code`",
        description: "Inline code",
      },
      {
        id: "drawing",
        label: "Drawing",
        icon: <PenTool className="w-4 h-4" />,
        action: "drawing",
        description: "Create a drawing",
      },
      {
        id: "divider",
        label: "Divider",
        icon: <Minus className="w-4 h-4" />,
        action: "\n---\n",
        description: "Add a horizontal line",
      },
      {
        id: "link",
        label: "Link",
        icon: <Link className="w-4 h-4" />,
        action: "[link text](url)",
        description: "Add a hyperlink",
      },
      {
        id: "image",
        label: "Image",
        icon: <ImageIcon className="w-4 h-4" />,
        action: "![alt text](image-url)",
        description: "Embed an image",
      },
      {
        id: "date",
        label: "Date",
        icon: <Calendar className="w-4 h-4" />,
        action: new Date().toLocaleDateString(),
        description: "Insert today's date",
      },
      {
        id: "tag",
        label: "Tag",
        icon: <Tag className="w-4 h-4" />,
        action: "#tag ",
        description: "Add a tag",
      },
    ],
    [],
  )

  const filteredNotes = useMemo(() => {
    if (!debouncedSearchQuery) return notes
    const query = debouncedSearchQuery.toLowerCase()
    return notes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query),
    )
  }, [notes, debouncedSearchQuery])

  const getCurrentViewNotes = useMemo(() => {
    switch (activeTab) {
      case "everything":
        return filteredNotes
      case "spaces":
        return []
      case "serendipity":
        return []
      default:
        return filteredNotes
    }
  }, [activeTab, filteredNotes])

  const previewContent = useMemo(() => {
    if (!newNote.content) return null
    return parseMarkdown(newNote.content)
  }, [newNote.content])

  const viewingNoteContent = useMemo(() => {
    if (!viewingNote) return ""
    return parseMarkdown(viewingNote.content)
  }, [viewingNote])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPos = e.target.selectionStart

      startTransition(() => {
        setNewNote((prev) => ({ ...prev, content: value }))
        setCursorPosition(cursorPos)

        // Slash command detection
        const textBeforeCursor = value.substring(0, cursorPos)
        const lastSlashIndex = textBeforeCursor.lastIndexOf("/")

        if (
          lastSlashIndex !== -1 &&
          (lastSlashIndex === 0 ||
            textBeforeCursor[lastSlashIndex - 1] === "\n" ||
            textBeforeCursor[lastSlashIndex - 1] === " ")
        ) {
          const searchTerm = textBeforeCursor.substring(lastSlashIndex + 1)
          if (
            searchTerm.length === 0 ||
            slashCommands.some((cmd) => cmd.label.toLowerCase().includes(searchTerm.toLowerCase()))
          ) {
            setShowSlashMenu(true)
            setSelectedCommandIndex(0)
          } else {
            setShowSlashMenu(false)
          }
        } else {
          setShowSlashMenu(false)
        }
      })
    },
    [slashCommands],
  )

  const executeSlashCommand = useCallback(
    (command: SlashCommand) => {
      if (command.id === "drawing") {
        setIsDrawingModalOpen(true)
        setShowSlashMenu(false)
        return
      }

      const content = newNote.content
      const textBeforeCursor = content.substring(0, cursorPosition)
      const textAfterCursor = content.substring(cursorPosition)
      const lastSlashIndex = textBeforeCursor.lastIndexOf("/")

      const beforeSlash = content.substring(0, lastSlashIndex)
      const newContent = beforeSlash + command.action + textAfterCursor

      setNewNote((prev) => ({ ...prev, content: newContent }))
      setShowSlashMenu(false)
    },
    [newNote.content, cursorPosition],
  )

  const handleSaveDrawing = useCallback(
    (drawingData: string) => {
      console.log("handleSaveDrawing called with data length:", drawingData.length)
      console.log("isEditingExistingDrawing:", isEditingExistingDrawing)
      console.log("viewingNote:", viewingNote?.id)
      console.log("Drawing data preview:", drawingData.substring(0, 100) + "...")

      if (isEditingExistingDrawing) {
        // Check if we're editing a drawing from an existing saved note
        if (viewingNote) {
          console.log("Updating existing note drawing")
          // Update the drawing in the existing saved note
          const updatedContent = viewingNote.content.replace(
            `\`\`\`drawing\n${editingDrawingData}\n\`\`\``,
            `\`\`\`drawing\n${drawingData}\n\`\`\``,
          )

          console.log("Updated content:", updatedContent.substring(0, 200) + "...")

          // Update the note in the notes array
          setNotes((prev) =>
            prev.map((note) => (note.id === viewingNote.id ? { ...note, content: updatedContent } : note)),
          )

          // Update the viewing note state to reflect changes immediately
          setViewingNote((prev) => (prev ? { ...prev, content: updatedContent } : null))
        } else {
          console.log("Updating new note drawing")
          // Update existing drawing in the note content (during note creation/editing)
          const content = newNote.content
          const updatedContent = content.replace(
            `\`\`\`drawing\n${editingDrawingData}\n\`\`\``,
            `\`\`\`drawing\n${drawingData}\n\`\`\``,
          )
          setNewNote((prev) => ({ ...prev, content: updatedContent }))
        }
        setIsEditingExistingDrawing(false)
        setEditingDrawingData("")
      } else {
        console.log("Inserting new drawing")
        // Insert new drawing
        const content = newNote.content
        const textBeforeCursor = content.substring(0, cursorPosition)
        const textAfterCursor = content.substring(cursorPosition)
        const lastSlashIndex = textBeforeCursor.lastIndexOf("/")

        const beforeSlash = content.substring(0, lastSlashIndex)
        const drawingBlock = `\n\`\`\`drawing\n${drawingData}\n\`\`\`\n`
        const newContent = beforeSlash + drawingBlock + textAfterCursor

        console.log("New content with drawing:", newContent.substring(0, 200) + "...")
        setNewNote((prev) => ({ ...prev, content: newContent }))
      }
      setIsDrawingModalOpen(false)
    },
    [newNote.content, cursorPosition, isEditingExistingDrawing, editingDrawingData, viewingNote],
  )

  const handleEditDrawing = useCallback((oldDrawingData: string, newDrawingData: string) => {
    setEditingDrawingData(oldDrawingData)
    setIsEditingExistingDrawing(true)
    setIsDrawingModalOpen(true)
  }, [])

  const handleCloseDrawingModal = useCallback(() => {
    setIsDrawingModalOpen(false)
    setIsEditingExistingDrawing(false)
    setEditingDrawingData("")
  }, [])

  const handleSaveNote = useCallback(() => {
    if (newNote.title.trim() && newNote.content.trim()) {
      startTransition(() => {
        if (editingNote) {
          setNotes((prev) =>
            prev.map((note) =>
              note.id === editingNote.id
                ? { ...note, title: newNote.title.trim(), content: newNote.content.trim() }
                : note,
            ),
          )
          setEditingNote(null)
        } else {
          const note: Note = {
            id: Date.now(),
            title: newNote.title.trim(),
            content: newNote.content.trim(),
            createdAt: new Date(),
          }
          setNotes((prev) => [note, ...prev])
        }
        setNewNote({ title: "", content: "" })
        setIsModalOpen(false)
        setShowSlashMenu(false)
      })
    }
  }, [newNote, editingNote])

  const handleDeleteNote = useCallback((id: number) => {
    setNoteToDelete(id)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      startTransition(() => {
        setNotes((prev) => prev.filter((note) => note.id !== noteToDelete))
      })
      setNoteToDelete(null)
    }
  }, [noteToDelete])

  const handleCancelDelete = useCallback(() => {
    setNoteToDelete(null)
  }, [])

  const handleNoteClick = useCallback((note: Note) => {
    router.push(`/notes/edit/${note.id}`)
  }, [router])

  const handleEditNote = useCallback((note: Note) => {
    router.push(`/notes/edit/${note.id}`)
  }, [router])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingNote(null)
    setNewNote({ title: "", content: "" })
    setShowSlashMenu(false)
  }, [])

  const handleCloseViewer = useCallback(() => {
    setViewingNote(null)
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setNewNote((prev) => ({ ...prev, title }))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("notes_layout")
      if (saved === "2" || saved === "3" || saved === "4") {
        setNotesLayout(saved)
      }
    } catch {
      // ignore
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ layout?: unknown }>
      const layout = custom.detail?.layout
      if (layout === "2" || layout === "3" || layout === "4") {
        setNotesLayout(layout)
      }
    }

    window.addEventListener("notesio:layout", handler as EventListener)
    return () => {
      window.removeEventListener("notesio:layout", handler as EventListener)
    }
  }, [])

  const notesGridClassName =
    notesLayout === "2"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr items-stretch"
      : notesLayout === "3"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr items-stretch"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr items-stretch"

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-background" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab as (tab: "everything" | "spaces" | "serendipity") => void} />

        <Sidebar />

        <main className="ml-14 pt-16 px-8 relative z-10">
          <div className="max-w-6xl">
            {/* Search Header */}
            <div className="mb-8 pt-4">
              <SearchInput searchQuery={searchQuery} onSearchChange={handleSearchChange} />
            </div>

            {/* Notes Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={notesGridClassName}
            >
              <NextLink href="/notes/new">
                <motion.div
                  whileHover={{ scale: 1.005, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                  whileTap={{ scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-card text-card-foreground rounded-xl p-6 cursor-pointer min-h-[160px] h-full flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_18px_rgba(0,0,0,0.45)] transition-shadow border border-border"
                >
                  <span 
                    className="font-semibold tracking-widest uppercase" 
                    style={{ color: '#E8613A', fontSize: '12px', fontFamily: '"Nunito Sans", sans-serif' }}
                  >
                    ADD A NEW NOTE
                  </span>
                  <p 
                    className="mt-3 text-muted-foreground"
                    style={{ fontSize: '12px', fontFamily: '"Nunito Sans", sans-serif' }}
                  >
                    Start typing here...
                  </p>
                  <div className="flex-1" />
                </motion.div>
              </NextLink>

              {/* Existing Notes */}
              <AnimatePresence mode="popLayout">
                {getCurrentViewNotes.map((note, index) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onNoteClick={handleNoteClick}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                    parsedContent={parseMarkdown(note.content)}
                    onEditDrawing={handleEditDrawing}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
      </main>

      {/* NoteViewer removed - clicking note opens edit page directly */}
      {/*
      <NoteViewer
        note={viewingNote}
        parsedContent={viewingNoteContent}
        onClose={handleCloseViewer}
        onEdit={handleEditNote}
        onEditDrawing={handleEditDrawing}
      />
      */}

      <AnimatePresence>
        {isModalOpen && (
          <NoteEditor
            isOpen={isModalOpen}
            editingNote={editingNote}
            newNote={newNote}
            showSlashMenu={showSlashMenu}
            selectedCommandIndex={selectedCommandIndex}
            slashCommands={slashCommands}
            previewContent={previewContent}
            onClose={handleCloseModal}
            onSave={handleSaveNote}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onCommandSelect={executeSlashCommand}
            onSlashMenuNavigate={(direction: "up" | "down") => {
              if (direction === "down") {
                setSelectedCommandIndex((prev) => (prev < slashCommands.length - 1 ? prev + 1 : 0))
              } else {
                setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : slashCommands.length - 1))
              }
            }}
            onSlashMenuClose={() => setShowSlashMenu(false)}
          />
        )}
      </AnimatePresence>

      <ExcalidrawModal
        isOpen={isDrawingModalOpen}
        onClose={handleCloseDrawingModal}
        onSave={handleSaveDrawing}
        initialData={isEditingExistingDrawing ? editingDrawingData : undefined}
      />

      <DeleteConfirmationModal
        isOpen={noteToDelete !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      </div>
    </ProtectedRoute>
  )
}
