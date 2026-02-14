"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NavigationTabs from "@/components/navigation-tabs"
import SearchInput from "@/components/search-input"
import Sidebar from "@/components/sidebar"
import NoteCard from "@/components/note-card"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import ProtectedRoute from "@/components/protected-route"
import NextLink from "next/link"
import { useRouter } from "next/navigation"

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
}

export default function MyMindApp() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [notesLayout, setNotesLayout] = useState<"2" | "3" | "4">("4")
  const [activeTab, setActiveTab] = useState<"everything" | "spaces" | "serendipity">("everything")
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null)

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

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query),
    )
  }, [notes, searchQuery])

  const getCurrentViewNotes = useMemo(() => {
    switch (activeTab) {
      case "everything":
        return filteredNotes
      case "spaces":
      case "serendipity":
        return []
      default:
        return filteredNotes
    }
  }, [activeTab, filteredNotes])

  const handleNoteClick = useCallback(
    (note: Note) => router.push(`/notes/edit/${note.id}`),
    [router],
  )

  const handleEditNote = useCallback(
    (note: Note) => router.push(`/notes/edit/${note.id}`),
    [router],
  )

  const handleDeleteNote = useCallback((id: number) => {
    setNoteToDelete(id)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      setNotes((prev) => {
        const updated = prev.filter((note) => note.id !== noteToDelete)
        localStorage.setItem(
          "notes",
          JSON.stringify(updated.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))),
        )
        return updated
      })
      setNoteToDelete(null)
    }
  }, [noteToDelete])

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
    return () => window.removeEventListener("notesio:layout", handler as EventListener)
  }, [])

  const notesGridClassName =
    notesLayout === "2"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr items-stretch"
      : notesLayout === "3"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr items-stretch"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr items-stretch"

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen relative overflow-hidden bg-background"
        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
      >
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab as (tab: "everything" | "spaces" | "serendipity") => void}
        />
        <Sidebar />

        <main className="ml-14 pt-16 px-8 relative z-10">
          <div className="max-w-6xl">
            <div className="mb-8 pt-4">
              <SearchInput searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
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
                    style={{ color: "#E8613A", fontSize: "12px", fontFamily: '"Nunito Sans", sans-serif' }}
                  >
                    ADD A NEW NOTE
                  </span>
                  <p
                    className="mt-3 text-muted-foreground"
                    style={{ fontSize: "12px", fontFamily: '"Nunito Sans", sans-serif' }}
                  >
                    Start typing here...
                  </p>
                  <div className="flex-1" />
                </motion.div>
              </NextLink>

              <AnimatePresence mode="popLayout">
                {getCurrentViewNotes.map((note, index) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onNoteClick={handleNoteClick}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>

        <DeleteConfirmationModal
          isOpen={noteToDelete !== null}
          onClose={() => setNoteToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </ProtectedRoute>
  )
}
