"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NavigationTabs from "@/components/navigation-tabs"
import Sidebar from "@/components/sidebar"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import ProtectedRoute from "@/components/protected-route"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Plus, MoreHorizontal, Pin, Moon, Sun, LogOut, X } from "lucide-react"
import { useTheme } from "next-themes"
import SearchInput from "@/components/search-input"
import {
  getNotesFromFirestore,
  deleteNoteFromFirestore,
  queuePendingDelete,
} from "@/lib/notes-service"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  pinned?: boolean
}

// Helper to group notes by time period
function groupNotesByDate(notes: Note[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const groups: { title: string; notes: Note[] }[] = [
    { title: "Today", notes: [] },
    { title: "Previous 7 Days", notes: [] },
    { title: "Previous 30 Days", notes: [] },
    { title: "Older", notes: [] },
  ]

  notes.forEach((note) => {
    const noteDate = new Date(note.createdAt)
    if (noteDate >= today) {
      groups[0].notes.push(note)
    } else if (noteDate >= sevenDaysAgo) {
      groups[1].notes.push(note)
    } else if (noteDate >= thirtyDaysAgo) {
      groups[2].notes.push(note)
    } else {
      groups[3].notes.push(note)
    }
  })

  return groups.filter((g) => g.notes.length > 0)
}

// Mobile Note Card - Apple Notes Style
function MobileNoteCard({
  note,
  onClick,
  onPin
}: {
  note: Note
  onClick: () => void
  onPin: () => void
}) {
  const preview = note.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 80)

  const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative bg-[#f5f5f5] dark:bg-[#1c1c1e] rounded-xl px-4 py-3 cursor-pointer active:bg-[#e8e8e8] dark:active:bg-[#2c2c2e] transition-colors"
    >
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onPin()
        }}
        className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
          note.pinned
            ? "text-[#E8613A]"
            : "text-muted-foreground/30"
        }`}
      >
        <Pin className={`w-3.5 h-3.5 ${note.pinned ? "fill-current" : ""}`} />
      </button>

      <div className="font-semibold text-foreground text-[15px] truncate pr-6">
        {note.title || "Untitled"}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-muted-foreground/70 text-[13px]">{dateStr}</span>
        <span className="text-muted-foreground/50 text-[13px] truncate flex-1">
          {preview || "No additional text"}
        </span>
      </div>
    </motion.div>
  )
}

// Desktop Note Card
function DesktopNoteCard({
  note,
  index,
  onClick,
  onDelete
}: {
  note: Note
  index: number
  onClick: () => void
  onDelete: () => void
}) {
  const preview = note.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 120)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-card text-card-foreground rounded-lg p-4 cursor-pointer shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] hover:shadow-md transition-all min-h-[100px] flex flex-col border border-border"
    >
      <h3 className="text-sm font-medium text-foreground mb-1.5 pr-8 line-clamp-1">
        {note.title || "Untitled"}
      </h3>
      <div className="text-muted-foreground text-xs line-clamp-2 flex-1">
        {preview || "No content"}
      </div>
      <div className="text-xs text-muted-foreground/60 mt-2 pt-2 border-t border-border/50">
        {new Date(note.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </motion.div>
  )
}

export default function MyMindApp() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [notes, setNotes] = useState<Note[]>([])
  const [activeTab, setActiveTab] = useState<"everything" | "spaces" | "serendipity">("everything")
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // For theme icon hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load notes from Firestore
  useEffect(() => {
    async function loadNotes() {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        const firestoreNotes = await getNotesFromFirestore(user.uid)
        // Sort by date descending
        const sorted = firestoreNotes
          .map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt,
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setNotes(sorted)
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
      setLoading(false)
    }
    loadNotes()
  }, [user])

  const handleNoteClick = useCallback(
    (note: Note) => router.push(`/notes/edit/${note.id}`),
    [router],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (noteToDelete && user?.uid) {
      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete))
      if (navigator.onLine) {
        try {
          await deleteNoteFromFirestore(user.uid, noteToDelete)
        } catch (error) {
          console.error("Failed to delete:", error)
          queuePendingDelete(user.uid, noteToDelete)
        }
      } else {
        queuePendingDelete(user.uid, noteToDelete)
      }
      setNoteToDelete(null)
    }
  }, [noteToDelete, user])

  // Toggle pin for a note
  const handleTogglePin = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, pinned: !note.pinned } : note
      )
    )
  }, [])

  // Sort notes: pinned first, then by date
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notes])

  const groupedNotes = useMemo(() => groupNotesByDate(sortedNotes), [sortedNotes])

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.replace(/<[^>]*>/g, " ").toLowerCase().includes(query)
    )
  }, [notes, searchQuery])

  // Get pinned notes for mobile
  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.pinned), [filteredNotes])
  const unpinnedGroupedNotes = useMemo(() => {
    const unpinned = filteredNotes.filter((n) => !n.pinned)
    return groupNotesByDate(unpinned)
  }, [filteredNotes])

  // Mobile View - Apple Notes Style
  if (isMobile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          {/* Mobile Header with Search */}
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-end px-5 pt-4 pb-2">
              <button
                onClick={() => setShowMenu(true)}
                className="p-2 -mr-2 text-[#E8613A]"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
            <div className="px-5 pb-3">
              <SearchInput
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              <p className="text-[13px] text-muted-foreground/50 mt-2">
                {searchQuery.trim()
                  ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? "s" : ""}`
                  : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </header>

          {/* Menu Popup */}
          {showMenu && (
            <div className="fixed inset-0 z-[100]">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 right-4 left-4 bg-[#f5f5f5] dark:bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-xl"
              >
                {/* Close button */}
                <div className="flex justify-end p-3 pb-0">
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile */}
                <div className="px-5 pb-4 flex items-center gap-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-14 h-14 rounded-full"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#E8613A] flex items-center justify-center text-white text-xl font-semibold">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-[17px] truncate">
                      {user?.displayName || "User"}
                    </div>
                    <div className="text-muted-foreground text-[15px] truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border mx-5" />

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-full px-5 py-4 flex items-center gap-4 active:bg-black/5 dark:active:bg-white/5"
                >
                  {mounted && resolvedTheme === "dark" ? (
                    <Sun className="w-5 h-5 text-[#E8613A]" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#E8613A]" />
                  )}
                  <span className="text-foreground text-[17px]">
                    {mounted && resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>

                <div className="h-px bg-border mx-5" />

                {/* Logout */}
                <button
                  onClick={async () => {
                    await logout()
                    router.push("/")
                  }}
                  className="w-full px-5 py-4 flex items-center gap-4 active:bg-black/5 dark:active:bg-white/5"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 text-[17px]">Sign Out</span>
                </button>

                <div className="h-3" />
              </motion.div>
            </div>
          )}

          {/* Notes List */}
          <main className="px-5 pb-28">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 px-1">
                  <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Pinned</span>
                </div>
                <div className="space-y-2">
                  {pinnedNotes.map((note) => (
                    <MobileNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      onPin={() => handleTogglePin(note.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Notes */}
            {unpinnedGroupedNotes.map((group) => (
              <div key={group.title} className="mb-6">
                <div className="mb-2 px-1">
                  <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">{group.title}</span>
                </div>
                <div className="space-y-2">
                  {group.notes.map((note) => (
                    <MobileNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      onPin={() => handleTogglePin(note.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && !loading && (
              <div className="text-center py-16 text-muted-foreground">
                {searchQuery.trim() ? (
                  <>
                    <p className="text-[17px]">No Results</p>
                    <p className="text-[15px] mt-1 text-muted-foreground/60">Try a different search</p>
                  </>
                ) : (
                  <>
                    <p className="text-[17px]">No Notes</p>
                    <p className="text-[15px] mt-1 text-muted-foreground/60">Tap + to create one</p>
                  </>
                )}
              </div>
            )}
          </main>

          {/* Floating Add Button */}
          <NextLink href="/notes/new">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="fixed bottom-8 right-6 w-14 h-14 bg-[#E8613A] rounded-full flex items-center justify-center shadow-lg"
            >
              <Plus className="w-7 h-7 text-white" />
            </motion.button>
          </NextLink>

          <DeleteConfirmationModal
            isOpen={noteToDelete !== null}
            onClose={() => setNoteToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        </div>
      </ProtectedRoute>
    )
  }

  // Desktop View
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
            {/* Search Input */}
            <div className="mb-6 pt-4">
              <SearchInput
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery.trim()
                  ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? "s" : ""}`
                  : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Add New Note Card - only show when not searching */}
              {!searchQuery.trim() && (
                <NextLink href="/notes/new">
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    className="bg-card text-card-foreground rounded-lg p-4 cursor-pointer min-h-[100px] flex flex-col border border-border hover:shadow-md transition-shadow"
                  >
                    <span className="font-semibold tracking-widest uppercase text-[#E8613A] text-xs">
                      ADD A NEW NOTE
                    </span>
                    <p className="mt-1.5 text-muted-foreground text-xs">
                      Start typing here...
                    </p>
                  </motion.div>
                </NextLink>
              )}

              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note, index) => (
                  <DesktopNoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onClick={() => handleNoteClick(note)}
                    onDelete={() => setNoteToDelete(note.id)}
                  />
                ))}
              </AnimatePresence>

              {/* No results message */}
              {filteredNotes.length === 0 && searchQuery.trim() && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p className="text-lg">No results found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
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
