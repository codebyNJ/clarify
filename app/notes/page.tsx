"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NavigationTabs from "@/components/navigation-tabs"
import SearchInput from "@/components/search-input"
import Sidebar from "@/components/sidebar"
import NoteCard from "@/components/note-card"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import ProtectedRoute from "@/components/protected-route"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useTheme } from "next-themes"
import { SquarePen, Settings, Moon, Sun, ChevronDown, Pin } from "lucide-react"
import {
  getNotesFromFirestore,
  deleteNoteFromFirestore,
  queuePendingDelete,
  NoteData
} from "@/lib/notes-service"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
}

const PINNED_KEY = "clarify-pinned-notes"

function getPinnedIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePinnedIds(ids: string[]) {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(ids)) } catch {}
}

// ─── Date grouping ───
function groupNotesByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000)
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000)

  const groups: Record<string, Note[]> = {
    "Today": [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    "Older": [],
  }

  for (const note of notes) {
    const date = new Date(note.createdAt)
    if (date >= todayStart) groups["Today"].push(note)
    else if (date >= sevenDaysAgo) groups["Previous 7 Days"].push(note)
    else if (date >= thirtyDaysAgo) groups["Previous 30 Days"].push(note)
    else groups["Older"].push(note)
  }

  return Object.entries(groups)
    .filter(([, n]) => n.length > 0)
    .map(([label, n]) => ({ label, notes: n }))
}

// ─── Mobile note list row ───
function MobileNoteRow({ note, onClick, onTogglePin, isPinned }: {
  note: Note
  onClick: () => void
  onTogglePin: () => void
  isPinned: boolean
}) {
  const preview = note.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "2-digit"
  })

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-[15px] truncate font-sans">
          {note.title || "Untitled"}
        </h3>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5 leading-snug">
          <span>{dateStr}</span>
          <span className="mx-1.5 opacity-40">&middot;</span>
          <span>{preview || "No additional text"}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTogglePin() }}
        className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
          isPinned ? "text-[#E8613A]" : "text-muted-foreground/30"
        }`}
        aria-label={isPinned ? "Unpin note" : "Pin note"}
      >
        <Pin className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function MyMindApp() {
  const router = useRouter()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [notesLayout, setNotesLayout] = useState<"2" | "3" | "4">("4")
  const [activeTab, setActiveTab] = useState<"everything" | "spaces" | "serendipity">("everything")
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setPinnedIds(getPinnedIds()) }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const togglePin = useCallback((noteId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
      savePinnedIds(next)
      return next
    })
  }, [])

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!settingsOpen) return
    const handle = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [settingsOpen])

  // Load notes from Firestore only (single source of truth)
  useEffect(() => {
    async function loadNotes() {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        const firestoreNotes = await getNotesFromFirestore(user.uid)
        setNotes(firestoreNotes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          createdAt: n.createdAt,
        })))
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
      setLoading(false)
    }

    loadNotes()
  }, [user])

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

  // Split into pinned + unpinned, then group unpinned by date
  const pinnedNotes = useMemo(
    () => getCurrentViewNotes.filter((n) => pinnedIds.includes(n.id)),
    [getCurrentViewNotes, pinnedIds]
  )
  const unpinnedNotes = useMemo(
    () => getCurrentViewNotes.filter((n) => !pinnedIds.includes(n.id)),
    [getCurrentViewNotes, pinnedIds]
  )
  const groupedUnpinned = useMemo(
    () => groupNotesByDate(unpinnedNotes),
    [unpinnedNotes]
  )

  const handleNoteClick = useCallback(
    (note: Note) => router.push(`/notes/edit/${note.id}`),
    [router],
  )

  const handleEditNote = useCallback(
    (note: Note) => router.push(`/notes/edit/${note.id}`),
    [router],
  )

  const handleDeleteNote = useCallback((id: string) => {
    setNoteToDelete(id)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (noteToDelete && user?.uid) {
      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete))

      if (navigator.onLine) {
        try {
          await deleteNoteFromFirestore(user.uid, noteToDelete)
        } catch (error) {
          console.error("Failed to delete from Firestore:", error)
          queuePendingDelete(user.uid, noteToDelete)
        }
      } else {
        queuePendingDelete(user.uid, noteToDelete)
      }

      setNoteToDelete(null)
    }
  }, [noteToDelete, user])

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

        {isMobile ? (
          /* ─── MOBILE ─── */
          <main className="min-h-screen overflow-y-auto scroll-smooth pt-4 pb-24 pl-6 pr-4 relative z-10">
            {/* Top bar: settings (right) */}
            <div className="flex items-center justify-end pt-4 pb-1">
              <div ref={settingsRef} className="relative">
                <button
                  type="button"
                  aria-label="Settings"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  className="p-2 text-muted-foreground"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 top-10 bg-popover border border-border rounded-xl shadow-lg py-2 px-1 min-w-[180px] z-50">
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme()
                        setSettingsOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      {mounted && resolvedTheme === "dark" ? (
                        <Sun className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Moon className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search — same serif style as desktop */}
            <div className="mb-6 pr-1">
              <SearchInput searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            </div>

            {/* ── Pinned section ── */}
            {pinnedNotes.length > 0 && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setPinnedCollapsed((p) => !p)}
                  className="flex items-center gap-1.5 mb-2 px-1"
                >
                  <h2 className="text-base font-bold text-foreground font-sans">Pinned</h2>
                  <ChevronDown className={`w-4 h-4 text-[#E8613A] transition-transform ${pinnedCollapsed ? "-rotate-90" : ""}`} />
                </button>

                {!pinnedCollapsed && (
                  <div className="bg-card rounded-xl divide-y divide-border border border-border overflow-hidden">
                    {pinnedNotes.map((note) => (
                      <MobileNoteRow
                        key={note.id}
                        note={note}
                        onClick={() => handleNoteClick(note)}
                        onTogglePin={() => togglePin(note.id)}
                        isPinned
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Date-grouped sections ── */}
            {groupedUnpinned.map((group) => (
              <div key={group.label} className="mb-5">
                <h2 className="text-base font-bold text-foreground mb-2 px-1 font-sans">
                  {group.label}
                </h2>
                <div className="bg-card rounded-xl divide-y divide-border border border-border overflow-hidden">
                  {group.notes.map((note) => (
                    <MobileNoteRow
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      onTogglePin={() => togglePin(note.id)}
                      isPinned={false}
                    />
                  ))}
                </div>
              </div>
            ))}

            {getCurrentViewNotes.length === 0 && (
              <div className="pt-8 text-center text-muted-foreground text-sm">
                {searchQuery ? "No notes match your search." : "No notes yet. Tap the button below to create one."}
              </div>
            )}

            {/* Floating compose button — bottom right */}
            <NextLink href="/notes/new">
              <div className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-[#E8613A] flex items-center justify-center shadow-lg active:scale-95 transition-transform safe-area-inset-bottom">
                <SquarePen className="w-6 h-6 text-white" />
              </div>
            </NextLink>
          </main>
        ) : (
          /* ─── DESKTOP: existing grid (unchanged) ─── */
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
        )}

        <DeleteConfirmationModal
          isOpen={noteToDelete !== null}
          onClose={() => setNoteToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </ProtectedRoute>
  )
}
