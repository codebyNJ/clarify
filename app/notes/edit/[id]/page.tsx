"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { EditorLoading } from "@/components/editor-loading";
import { useAuth } from "@/contexts/auth-context";
import { getNoteById } from "@/lib/notes-service";

const SimpleEditor = dynamic(
  () =>
    import("@/components/notes/simple-editor").then(
      (mod) => mod.SimpleEditor
    ),
  {
    ssr: false,
    loading: () => <EditorLoading />,
  }
);

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const noteId = params.id as string;
  const [note, setNote] = useState<{
    title: string;
    content: string;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const firestoreNote = await getNoteById(user.uid, noteId);
        if (firestoreNote) {
          setNote({
            title: firestoreNote.title,
            content: firestoreNote.content,
            createdAt: firestoreNote.createdAt,
          });
        } else {
          // Note not found in Firestore
          router.push("/notes");
        }
      } catch (error) {
        console.error("Error loading note:", error);
        router.push("/notes");
      }
      setLoading(false);
    }

    loadNote();
  }, [noteId, router, user]);

  if (loading || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <SimpleEditor
      noteId={noteId}
      initialTitle={note.title}
      initialContent={note.content}
      isEditing
      createdAt={note.createdAt}
    />
  );
}
