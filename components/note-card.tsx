"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Edit3, X, PenTool } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  createdAt: Date
}

interface NoteCardProps {
  note: Note
  index: number
  onNoteClick: (note: Note) => void
  onEditNote: (note: Note) => void
  onDeleteNote: (id: number) => void
  parsedContent: string
  onEditDrawing?: (drawingData: string, newDrawingData: string) => void
}

const NoteCard = React.memo<NoteCardProps>(({ 
  note, 
  index, 
  onNoteClick, 
  onEditNote, 
  onDeleteNote, 
  parsedContent, 
  onEditDrawing 
}) => {
  const renderedContent = useMemo(() => {
    // Split content by drawing blocks
    const parts = note.content.split(/```drawing\n([\s\S]*?)\n```/)
    const elements: React.ReactNode[] = []
    let hasContent = false
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text content
        const textContent = parts[i].trim()
        if (textContent) {
          hasContent = true
          // Apply basic markdown formatting and truncate for preview
          let formattedContent = textContent
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-muted/70 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
            .replace(/^#{1,3}\s+(.+)$/gm, '<strong class="font-semibold text-foreground">$1</strong>')
            .replace(/\n/g, ' ')
          
          // Truncate long content
          if (formattedContent.length > 200) {
            formattedContent = formattedContent.substring(0, 200) + '...'
          }
          
          elements.push(
            <div
              key={`text-${i}`}
              className="text-foreground/80 leading-relaxed mb-3 line-clamp-3 font-sans"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          )
        }
      } else {
        // Drawing block - show as indicator
        hasContent = true
        elements.push(
          <div key={`drawing-${i}`} className="my-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border">
              <PenTool className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Drawing {Math.floor(i / 2) + 1}</span>
              <span className="text-xs text-muted-foreground">• Interactive content</span>
            </div>
          </div>
        )
      }
    }
    
    // If no content found, show placeholder
    if (!hasContent || elements.length === 0) {
      elements.push(
        <div key="empty" className="text-muted-foreground italic font-sans">
          No content available
        </div>
      )
    }
    
    return elements
  }, [note.content])

  return (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative bg-card text-card-foreground rounded-lg p-5 cursor-pointer shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] hover:shadow-md dark:hover:shadow-[0_4px_18px_rgba(0,0,0,0.45)] transition-all duration-300 min-h-[140px] h-full flex flex-col border border-border"
      onClick={() => onNoteClick(note)}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 700, damping: 25, mass: 0.5 }}
          onClick={(e) => {
            e.stopPropagation()
            onEditNote(note)
          }}
          className="text-muted-foreground hover:text-orange-500 transition-colors duration-150 p-1 rounded hover:bg-muted"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 700, damping: 25, mass: 0.5 }}
          onClick={(e) => {
            e.stopPropagation()
            onDeleteNote(note.id)
          }}
          className="text-muted-foreground hover:text-red-500 transition-colors duration-150 p-1 rounded hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Note title */}
      <h3 className="text-sm font-serif italic text-foreground mb-2 pr-12 line-clamp-1">
        {note.title}
      </h3>
      
      {/* Content preview */}
      <div className="space-y-1 text-muted-foreground text-sm line-clamp-4 flex-1">
        {renderedContent}
      </div>
      
      {/* Creation time */}
      <div className="text-xs text-muted-foreground/60 mt-3 pt-3 border-t border-border/50">
        {note.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </motion.div>
  )
})

NoteCard.displayName = "NoteCard"

export default NoteCard