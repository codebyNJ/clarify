import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Note, COLLECTIONS, DEFAULT_NOTE_PERMISSIONS } from "@/lib/firestore-schema"
import DOMPurify from "dompurify"

// ==================== SECURITY ====================

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "b", "i", "u", "strong", "em", "span", "div",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "code", "pre",
    "a", "img", "hr", "table", "thead", "tbody", "tr", "th", "td",
    "input", "label", "font"
  ],
  ALLOWED_ATTR: [
    "href", "src", "alt", "title", "class", "style", "target", "rel",
    "data-media-id", "data-todo-id", "type", "checked"
  ],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
}

function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") return html
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG)
}

// ==================== TYPES ====================

export interface NoteData {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  workspaceId?: string | null
  tags?: string[]
  isPinned?: boolean
  isArchived?: boolean
  isFavorite?: boolean
}

interface PendingNote {
  note: NoteData
  userId: string
  action: "save" | "delete"
  queuedAt: string
}

const LS_KEYS = {
  DRAFT: "clarify_draft",
  PENDING: "clarify_pending_sync",
} as const

// ==================== FIRESTORE READS ====================

export async function getNotesFromFirestore(userId: string): Promise<NoteData[]> {
  const notesRef = collection(db, COLLECTIONS.notes(userId))
  const q = query(
    notesRef,
    where("isArchived", "==", false),
    orderBy("isPinned", "desc"),
    orderBy("updatedAt", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => firestoreToNoteData(d.data() as Note))
}

export async function getNoteById(
  userId: string,
  noteId: string
): Promise<NoteData | null> {
  const noteRef = doc(db, COLLECTIONS.notes(userId), noteId)
  const noteSnap = await getDoc(noteRef)
  if (!noteSnap.exists()) return null
  const data = noteSnap.data() as Note
  updateDoc(noteRef, { lastViewedAt: serverTimestamp() }).catch(() => {})
  return firestoreToNoteData(data)
}

export async function searchNotes(
  userId: string,
  searchTerm: string
): Promise<NoteData[]> {
  const notesRef = collection(db, COLLECTIONS.notes(userId))
  const q = query(notesRef, where("isArchived", "==", false), orderBy("updatedAt", "desc"))
  const snapshot = await getDocs(q)
  const searchLower = searchTerm.toLowerCase()
  return snapshot.docs
    .map((d) => {
      const data = d.data() as Note
      return { ...firestoreToNoteData(data), _score: calculateSearchScore(data, searchLower) }
    })
    .filter((n) => n._score > 0)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...note }) => note)
}

// ==================== FIRESTORE WRITES ====================

export async function saveNoteToFirestore(
  userId: string,
  note: NoteData
): Promise<void> {
  const noteRef = doc(db, COLLECTIONS.notes(userId), note.id)

  // Sanitize content before saving
  const sanitizedContent = sanitizeHTML(note.content)
  // Sanitize title (strip all HTML)
  const sanitizedTitle = note.title.replace(/<[^>]*>/g, "").trim().slice(0, 500)

  const contentPlainText = extractPlainText(sanitizedContent)
  const searchKeywords = generateSearchKeywords(sanitizedTitle, contentPlainText)
  const firestoreNote: Partial<Note> = {
    id: note.id,
    userId,
    title: sanitizedTitle,
    content: sanitizedContent,
    contentPlainText,
    workspaceId: note.workspaceId || null,
    tags: note.tags || [],
    color: null,
    isPinned: note.isPinned || false,
    isArchived: note.isArchived || false,
    isFavorite: note.isFavorite || false,
    isShared: false,
    shareId: null,
    permissions: DEFAULT_NOTE_PERMISSIONS,
    wordCount: countWords(contentPlainText),
    readingTime: calculateReadingTime(contentPlainText),
    updatedAt: serverTimestamp() as any,
    lastViewedAt: serverTimestamp() as any,
    searchKeywords,
    version: 1,
  }
  const noteSnap = await getDoc(noteRef)
  if (!noteSnap.exists()) {
    await setDoc(noteRef, { ...firestoreNote, createdAt: serverTimestamp() })
    const userRef = doc(db, COLLECTIONS.users, userId)
    await updateDoc(userRef, { noteCount: increment(1), updatedAt: serverTimestamp() })
  } else {
    await updateDoc(noteRef, firestoreNote)
  }
}

export async function deleteNoteFromFirestore(
  userId: string,
  noteId: string
): Promise<void> {
  const noteRef = doc(db, COLLECTIONS.notes(userId), noteId)
  await deleteDoc(noteRef)
  const userRef = doc(db, COLLECTIONS.users, userId)
  await updateDoc(userRef, { noteCount: increment(-1), updatedAt: serverTimestamp() })
}

// ==================== DRAFT (crash-recovery buffer while editing) ====================

export function saveDraft(note: NoteData): void {
  if (typeof window === "undefined") return
  try {
    // Sanitize content before storing in localStorage
    const sanitizedNote = {
      ...note,
      title: note.title.replace(/<[^>]*>/g, "").trim().slice(0, 500),
      content: sanitizeHTML(note.content),
    }
    localStorage.setItem(LS_KEYS.DRAFT, JSON.stringify(sanitizedNote))
  } catch {
    // quota exceeded
  }
}

export function getDraft(): NoteData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LS_KEYS.DRAFT)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LS_KEYS.DRAFT)
}

// ==================== OFFLINE PENDING QUEUE (PWA-ready) ====================

function getPendingQueue(): PendingNote[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.PENDING) || "[]")
  } catch {
    return []
  }
}

function setPendingQueue(queue: PendingNote[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LS_KEYS.PENDING, JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export function queuePendingNote(
  userId: string,
  note: NoteData,
  action: "save" | "delete" = "save"
): void {
  // Sanitize note data before queuing
  const sanitizedNote = {
    ...note,
    title: note.title.replace(/<[^>]*>/g, "").trim().slice(0, 500),
    content: sanitizeHTML(note.content),
  }
  const queue = getPendingQueue()
  const filtered = queue.filter((p) => !(p.note.id === note.id && p.action === action))
  filtered.push({ note: sanitizedNote, userId, action, queuedAt: new Date().toISOString() })
  setPendingQueue(filtered)
}

export function queuePendingDelete(userId: string, noteId: string): void {
  const stub: NoteData = { id: noteId, title: "", content: "", createdAt: "", updatedAt: "" }
  queuePendingNote(userId, stub, "delete")
}

export async function flushPendingQueue(): Promise<number> {
  if (typeof window === "undefined") return 0
  if (!navigator.onLine) return 0
  const queue = getPendingQueue()
  if (queue.length === 0) return 0
  let synced = 0
  const remaining: PendingNote[] = []
  for (const item of queue) {
    try {
      if (item.action === "save") {
        await saveNoteToFirestore(item.userId, item.note)
      } else {
        await deleteNoteFromFirestore(item.userId, item.note.id)
      }
      synced++
    } catch {
      remaining.push(item)
    }
  }
  setPendingQueue(remaining)
  return synced
}

export async function saveNoteOnLeave(userId: string, note: NoteData): Promise<void> {
  if (navigator.onLine) {
    try {
      await saveNoteToFirestore(userId, note)
      clearDraft()
      return
    } catch {
      // fall through to queue
    }
  }
  queuePendingNote(userId, note, "save")
  clearDraft()
}

// ==================== CONNECTIVITY LISTENER ====================

let listenerAttached = false

export function initOfflineSyncListener(): void {
  if (typeof window === "undefined" || listenerAttached) return
  listenerAttached = true
  window.addEventListener("online", () => {
    flushPendingQueue().then((count) => {
      if (count > 0) console.log(`[Clarify] Synced ${count} pending note(s)`)
    })
  })
}

// ==================== HELPERS ====================

function firestoreToNoteData(data: Note): NoteData {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
    workspaceId: data.workspaceId,
    tags: data.tags,
    isPinned: data.isPinned,
    isArchived: data.isArchived,
    isFavorite: data.isFavorite,
  }
}

function extractPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  }
  // Sanitize HTML before extracting text to prevent XSS
  const sanitized = sanitizeHTML(html)
  const div = document.createElement("div")
  div.innerHTML = sanitized
  return div.textContent || div.innerText || ""
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function calculateReadingTime(text: string): number {
  return Math.ceil(countWords(text) / 200)
}

function generateSearchKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase()
  const words = text.split(/\s+/).filter((w) => w.length > 2)
  return [...new Set(words)].slice(0, 50)
}

function timestampToString(timestamp: Timestamp | any): string {
  if (!timestamp) return new Date().toISOString()
  if (timestamp.toDate) return timestamp.toDate().toISOString()
  return new Date().toISOString()
}

function calculateSearchScore(note: Note, searchTerm: string): number {
  let score = 0
  const titleLower = note.title.toLowerCase()
  const contentLower = note.contentPlainText.toLowerCase()
  if (titleLower === searchTerm) score += 100
  if (titleLower.includes(searchTerm)) score += 50
  if (note.searchKeywords.some((k) => k.includes(searchTerm))) score += 20
  if (contentLower.includes(searchTerm)) score += 10
  if (note.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) score += 30
  return score
}