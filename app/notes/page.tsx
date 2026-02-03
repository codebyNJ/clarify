"use client"

import type React from "react"
import { useState, useCallback, useMemo, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import NavigationTabs from "@/components/navigation-tabs"
import SearchInput from "@/components/search-input"
import Sidebar from "@/components/sidebar"
import NoteCard from "@/components/note-card"
import NoteEditor from "@/components/note-editor"
import NoteViewer from "@/components/note-viewer"
import ExcalidrawModal from "@/components/excalidraw-modal"
import ProtectedRoute from "@/components/protected-route"
import { parseMarkdown } from "@/lib/markdown-parser"
import { useDebounce } from "@/lib/hooks"
import { useAuth } from "@/contexts/auth-context"
import type { SlashCommand } from "@/lib/types"
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
  LogOut,
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
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"flows" | "spaces" | "hmmm">("flows")

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
      case "flows":
        return filteredNotes
      case "spaces":
        return []
      case "hmmm":
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
    startTransition(() => {
      setNotes((prev) => prev.filter((note) => note.id !== id))
    })
  }, [])

  const handleNoteClick = useCallback((note: Note) => {
    setViewingNote(note)
  }, [])

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note)
    setNewNote({ title: note.title, content: note.content })
    setViewingNote(null)
    setIsModalOpen(true)
  }, [])

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white relative overflow-hidden">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="fixed inset-0 pointer-events-none">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 45,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-300/6 to-amber-400/6 rounded-full blur-3xl will-change-transform"
          />
          <motion.div
            animate={{
              x: [0, -25, 0],
              y: [0, 18, 0],
            }}
            transition={{
              duration: 55,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute top-1/2 right-32 w-80 h-80 bg-gradient-to-br from-amber-400/8 to-orange-500/8 rounded-full blur-3xl will-change-transform"
          />
          <motion.div
            animate={{
              x: [0, 20, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 65,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-yellow-300/4 to-orange-300/6 rounded-full blur-3xl will-change-transform"
          />
        </div>

        <Sidebar />

        <main className="ml-16 p-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <SearchInput searchQuery={searchQuery} onSearchChange={handleSearchChange} />
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  {user?.email}
                </span>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-orange-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.3,
            }}
            className="mb-8"
          >
            <Button
              onClick={() => setIsModalOpen(true)}
              className="glass-card rounded-2xl px-6 text-orange-700 hover:text-orange-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-out py-3"
              variant="ghost"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Note
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
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

          {getCurrentViewNotes.length === 0 && notes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
                <h3 className="text-xl text-slate-700 mb-2">Your mind is empty</h3>
                <p className="text-slate-600 mb-6">Start capturing your thoughts and ideas</p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="glass-card rounded-2xl px-6 py-3 text-orange-700 hover:text-orange-800 transition-all duration-300 ease-out"
                  variant="ghost"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create your first note
                </Button>
              </div>
            </motion.div>
          )}

          {getCurrentViewNotes.length === 0 && notes.length > 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
                <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl text-slate-700 mb-2">No notes found</h3>
                <p className="text-slate-600">Try a different search term</p>
              </div>
            </motion.div>
          )}

          {activeTab === "spaces" && getCurrentViewNotes.length === 0 && notes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
                <Tag className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl text-slate-700 mb-2">No spaces created yet</h3>
                <p className="text-slate-600">Organize your notes into colored spaces</p>
              </div>
            </motion.div>
          )}

          {activeTab === "hmmm" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
                <Sparkles className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl text-slate-700 mb-2">Hmm...</h3>
                <p className="text-slate-600">Something interesting will be here soon</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <NoteViewer
        note={viewingNote}
        parsedContent={viewingNoteContent}
        onClose={handleCloseViewer}
        onEdit={handleEditNote}
        onEditDrawing={handleEditDrawing}
      />

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
      </div>
    </ProtectedRoute>
  )
}
