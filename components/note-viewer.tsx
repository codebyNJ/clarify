"use client"

import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Edit3 } from "lucide-react"
import dynamic from "next/dynamic" // Import dynamic
// import DrawingViewer from "./drawing-viewer" // Remove direct import
import ExcalidrawModal from "./excalidraw-modal"
import { parseMarkdown } from "../lib/markdown-parser"

// Dynamically import DrawingViewer with SSR disabled
const DrawingViewer = dynamic(() => import('./drawing-viewer'), {
  ssr: false,
  loading: () => <div className="h-40 flex items-center justify-center text-slate-400">Loading drawing...</div>,
})

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
}

interface NoteViewerProps {
  note: Note | null
  parsedContent?: string
  onClose: () => void
  onEdit: (note: Note) => void
  onEditDrawing?: (drawingData: string, newDrawingData: string) => void
  onUpdateNote?: (updatedNote: Note) => void
}

const NoteViewer = React.memo<NoteViewerProps>(({ 
  note, 
  parsedContent, 
  onClose, 
  onEdit, 
  onEditDrawing,
  onUpdateNote 
}) => {
  const [showDrawingModal, setShowDrawingModal] = useState(false)
  const [editingDrawingData, setEditingDrawingData] = useState<string>("")
  const [editingDrawingIndex, setEditingDrawingIndex] = useState<number>(-1)

  const renderedContent = useMemo(() => {
    if (!note) return []
    
    // Split content by drawing blocks
    const parts = note.content.split(/```drawing\n([\s\S]*?)\n```/)
    const elements: React.ReactNode[] = []
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text content
        const textContent = parts[i].trim()
        if (textContent) {
          // Use the improved markdown parser
          try {
            const formattedContent = parseMarkdown(textContent)
            
            elements.push(
              <div
                key={`text-${i}`}
                className="text-foreground/80 leading-relaxed text-lg font-sans mb-6"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            )
          } catch (error) {
            console.error('Markdown parsing error in viewer:', error)
            // Fallback to simple formatting
            const fallbackContent = textContent
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic text-foreground/80">$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground border">$1</code>')
              .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-xl font-semibold text-foreground mt-6 mb-3">$1</h3>')
              .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-foreground mt-8 mb-4">$1</h2>')
              .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-foreground mt-8 mb-6">$1</h1>')
              .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-foreground/80">')
              .replace(/\n/g, '<br />')
            
            const wrappedContent = fallbackContent.includes('<h') 
              ? fallbackContent 
              : `<p class="mb-4 leading-relaxed text-foreground/80">${fallbackContent}</p>`
            
            elements.push(
              <div
                key={`text-${i}`}
                className="text-foreground/80 leading-relaxed text-lg font-sans mb-6"
                dangerouslySetInnerHTML={{ __html: wrappedContent }}
              />
            )
          }
        }
      } else {
        // Drawing block
        const drawingData = parts[i]
        const drawingIndex = Math.floor(i / 2)
        
        const handleEditDrawing = () => {
          setEditingDrawingData(drawingData)
          setEditingDrawingIndex(drawingIndex)
          setShowDrawingModal(true)
        }
        
        elements.push(
          <div key={`drawing-${i}`} className="my-8">
            <DrawingViewer
              drawingData={drawingData}
              isPreview={true}
              onEdit={handleEditDrawing}
            />
          </div>
        )
      }
    }
    
    return elements
  }, [note])

  const handleSaveDrawing = (newDrawingData: string) => {
    if (!note) return
    
    // Update the drawing in the note content
    const parts = note.content.split(/```drawing\n([\s\S]*?)\n```/)
    const updatedParts = [...parts]
    
    // Replace the drawing data at the correct index
    const drawingPartIndex = (editingDrawingIndex * 2) + 1
    if (drawingPartIndex < updatedParts.length) {
      updatedParts[drawingPartIndex] = newDrawingData
    }
    
    // Reconstruct the content
    let updatedContent = ""
    for (let i = 0; i < updatedParts.length; i++) {
      if (i % 2 === 0) {
        updatedContent += updatedParts[i]
      } else {
        updatedContent += `\`\`\`drawing\n${updatedParts[i]}\n\`\`\``
      }
    }
    
    const updatedNote = {
      ...note,
      content: updatedContent
    }
    
    onUpdateNote?.(updatedNote)
    setShowDrawingModal(false)
    setEditingDrawingData("")
    setEditingDrawingIndex(-1)
  }

  const handleClose = () => {
    setShowDrawingModal(false)
    setEditingDrawingData("")
    setEditingDrawingIndex(-1)
    onClose()
  }

  return (
    <>
      <AnimatePresence>
        {note && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.2,
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-medium text-foreground pr-8">{note.title}</h2>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    onClick={() => onEdit(note)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-orange-600"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={handleClose} 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-orange-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {renderedContent.length > 0 ? (
                  renderedContent
                ) : (
                  <p className="text-muted-foreground italic">No content available</p>
                )}
              </div>
              
              <div className="text-sm text-amber-600 dark:text-amber-400 mt-8 pt-6 border-t border-border">
                Created on {note.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Edit Modal */}
      <ExcalidrawModal
        isOpen={showDrawingModal}
        onClose={() => {
          setShowDrawingModal(false)
          setEditingDrawingData("")
          setEditingDrawingIndex(-1)
        }}
        onSave={handleSaveDrawing}
        initialData={editingDrawingData}
      />
    </>
  )
})

NoteViewer.displayName = "NoteViewer"

export default NoteViewer