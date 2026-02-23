"use client";

import dynamic from "next/dynamic";
import { EditorLoading } from "@/components/editor-loading";

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

export default function NewNotePage() {
  return <SimpleEditor />;
}
