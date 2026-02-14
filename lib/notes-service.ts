export interface NoteData {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// localStorage helpers
export function getNotesFromLocal(): NoteData[] {
  try {
    return JSON.parse(localStorage.getItem("notes") || "[]");
  } catch {
    return [];
  }
}

export function saveNoteToLocal(note: NoteData): void {
  const notes = getNotesFromLocal();
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.unshift(note);
  }
  localStorage.setItem("notes", JSON.stringify(notes));
}

// Lazy Firestore access — avoids triggering Firebase init at import time (SSR-safe)
async function getDb() {
  const { db } = await import("@/lib/firebase");
  return db;
}

// Firestore helpers
export async function saveNoteToFirestore(
  userId: string,
  note: NoteData
): Promise<void> {
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  const db = await getDb();
  const noteRef = doc(db, "users", userId, "notes", String(note.id));
  await setDoc(noteRef, {
    ...note,
    syncedAt: serverTimestamp(),
  });
}

export async function getNotesFromFirestore(
  userId: string
): Promise<NoteData[]> {
  const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
  const db = await getDb();
  const notesRef = collection(db, "users", userId, "notes");
  const q = query(notesRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as NoteData);
}

export async function deleteNoteFromFirestore(
  userId: string,
  noteId: number
): Promise<void> {
  const { doc, deleteDoc } = await import("firebase/firestore");
  const db = await getDb();
  const noteRef = doc(db, "users", userId, "notes", String(noteId));
  await deleteDoc(noteRef);
}
