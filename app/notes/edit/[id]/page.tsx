"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NoteEditor } from "@/components/notes/note-editor";

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = parseInt(params.id as string);
  const [note, setNote] = useState<{
    title: string;
    content: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    const found = savedNotes.find((n: any) => n.id === noteId);
    if (found) {
      setNote(found);
    } else {
      router.push("/notes");
    }
  }, [noteId, router]);

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <NoteEditor
      noteId={noteId}
      initialTitle={note.title}
      initialContent={note.content}
      isEditing
      createdAt={note.createdAt}
    />
  );
}
