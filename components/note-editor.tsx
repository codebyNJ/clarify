"use client"

import React, { useRef, useMemo, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, PenTool, Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3 } from "lucide-react"
import ExcalidrawModal from "./excalidraw-modal"
import dynamic from "next/dynamic"

// Dynamically import DrawingViewer with SSR disabled
const DrawingViewer = dynamic(() => import('./drawing-viewer'), {
  ssr: false,
  loading: () => <div className="h-32 flex items-center justify-center text-slate-400 border border-slate-200 rounded-2xl">Loading drawing...</div>,
})

interface Note {
  id: number
  title: string
  content: string
  drawings?: string[] // Array of drawing data
  createdAt: Date
}

interface NoteEditorProps {
  isOpen: boolean
  editingNote: Note | null
  newNote: { title: string; content: string; drawings?: string[] }
  previewContent: string | null
  showSlashMenu: boolean
  selectedCommandIndex: number
  slashCommands: any[]
  onClose: () => void
  onSave: () => void
  onTitleChange: (title: string) => void
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onCommandSelect: (command: any) => void
  onSlashMenuNavigate: (direction: "up" | "down") => void
  onSlashMenuClose: () => void
  onDrawingAdd?: (drawingData: string) => void
  onDrawingUpdate?: (index: number, drawingData: string) => void
  onDrawingDelete?: (index: number) => void
}

const NoteEditor = React.memo<NoteEditorProps>(
  ({
    isOpen,
    editingNote,
    newNote,
    previewContent,
    showSlashMenu,
    selectedCommandIndex,
    slashCommands,
    onClose,
    onSave,
    onTitleChange,
    onContentChange,
    onCommandSelect,
    onSlashMenuNavigate,
    onSlashMenuClose,
    onDrawingAdd,
    onDrawingUpdate,
    onDrawingDelete,
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [showDrawingModal, setShowDrawingModal] = useState(false)
    const [editingDrawingIndex, setEditingDrawingIndex] = useState<number | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)

    const isDisabled = useMemo(() => {
      return !newNote.title.trim() || !newNote.content.trim()
    }, [newNote.title, newNote.content])

    // Format text with markdown syntax
    const formatText = useCallback((format: string) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      const beforeText = textarea.value.substring(0, start)
      const afterText = textarea.value.substring(end)

      let formattedText = ''
      let newCursorPos = start

      switch (format) {
        case 'bold':
          formattedText = selectedText ? `**${selectedText}**` : '**bold text**'
          newCursorPos = selectedText ? start + formattedText.length : start + 2
          break
        case 'italic':
          formattedText = selectedText ? `*${selectedText}*` : '*italic text*'
          newCursorPos = selectedText ? start + formattedText.length : start + 1
          break
        case 'code':
          formattedText = selectedText ? `\`${selectedText}\`` : '`code`'
          newCursorPos = selectedText ? start + formattedText.length : start + 1
          break
        case 'h1':
          formattedText = `# ${selectedText || 'Heading 1'}`
          newCursorPos = start + formattedText.length
          break
        case 'h2':
          formattedText = `## ${selectedText || 'Heading 2'}`
          newCursorPos = start + formattedText.length
          break
        case 'h3':
          formattedText = `### ${selectedText || 'Heading 3'}`
          newCursorPos = start + formattedText.length
          break
        case 'quote':
          formattedText = `> ${selectedText || 'Quote'}`
          newCursorPos = start + formattedText.length
          break
        case 'ul':
          formattedText = `- ${selectedText || 'List item'}`
          newCursorPos = start + formattedText.length
          break
        case 'ol':
          formattedText = `1. ${selectedText || 'List item'}`
          newCursorPos = start + formattedText.length
          break
        default:
          return
      }

      const newContent = beforeText + formattedText + afterText
      
      // Trigger content change
      const event = {
        target: { value: newContent }
      } as React.ChangeEvent<HTMLTextAreaElement>
      onContentChange(event)

      // Set cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }, [onContentChange])

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (!isOpen || !textareaRef.current?.contains(e.target as Node)) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            formatText('bold')
            break
          case 'i':
            e.preventDefault()
            formatText('italic')
            break
          case '`':
            e.preventDefault()
            formatText('code')
            break
          case '1':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('h1')
            }
            break
          case '2':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('h2')
            }
            break
          case '3':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('h3')
            }
            break
          case 'q':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('quote')
            }
            break
          case 'u':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('ul')
            }
            break
          case 'o':
            if (e.shiftKey) {
              e.preventDefault()
              formatText('ol')
            }
            break
          case 'd':
            if (e.shiftKey) {
              e.preventDefault()
              insertDrawingAtCursor()
            }
            break
          case 's':
            e.preventDefault()
            if (!isDisabled) {
              onSave()
            }
            break
          case '/':
            e.preventDefault()
            setShowShortcuts(!showShortcuts)
            break
        }
      }

      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else {
          onClose()
        }
      }
    }, [isOpen, formatText, isDisabled, onSave, onClose, showShortcuts])

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const handleAddDrawing = () => {
      setEditingDrawingIndex(null)
      setShowDrawingModal(true)
    }

    const handleEditDrawing = (index: number) => {
      setEditingDrawingIndex(index)
      setShowDrawingModal(true)
    }

    const handleSaveDrawing = (drawingData: string) => {
      console.log('Saving drawing data:', drawingData.substring(0, 200) + '...')
      
      if (editingDrawingIndex !== null) {
        onDrawingUpdate?.(editingDrawingIndex, drawingData)
      } else {
        // Add new drawing
        onDrawingAdd?.(drawingData)
        
        // Insert drawing placeholder into content if cursor is positioned
        if (textareaRef.current) {
          const textarea = textareaRef.current
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const currentContent = newNote.content
          
          const drawingIndex = (newNote.drawings?.length || 0)
          const drawingPlaceholder = `\n\`\`\`drawing\n${drawingData}\n\`\`\`\n`
          
          const newContent = 
            currentContent.substring(0, start) + 
            drawingPlaceholder + 
            currentContent.substring(end)
          
          const event = {
            target: { value: newContent }
          } as React.ChangeEvent<HTMLTextAreaElement>
          onContentChange(event)
        }
      }
      
      setShowDrawingModal(false)
      setEditingDrawingIndex(null)
    }

    const handleDeleteDrawing = (index: number) => {
      onDrawingDelete?.(index)
      
      // Also remove from content if it exists
      if (newNote.drawings && newNote.drawings[index]) {
        const drawingData = newNote.drawings[index]
        const drawingBlock = `\`\`\`drawing\n${drawingData}\n\`\`\``
        const updatedContent = newNote.content.replace(drawingBlock, '')
        
        const event = {
          target: { value: updatedContent }
        } as React.ChangeEvent<HTMLTextAreaElement>
        onContentChange(event)
      }
    }

    const insertDrawingAtCursor = () => {
      if (textareaRef.current) {
        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentContent = newNote.content
        
        const drawingIndex = newNote.drawings?.length || 0
        const drawingPlaceholder = `\n[Drawing ${drawingIndex + 1} - Click to create]\n`
        
        const newContent = 
          currentContent.substring(0, start) + 
          drawingPlaceholder + 
          currentContent.substring(end)
        
        const event = {
          target: { value: newContent }
        } as React.ChangeEvent<HTMLTextAreaElement>
        onContentChange(event)
        
        // Set cursor after the placeholder
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = start + drawingPlaceholder.length
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          }
        }, 0)
        
        handleAddDrawing()
      }
    }

    // Parse drawings from content
    const parsedDrawings = useMemo(() => {
      const drawingBlocks = newNote.content.match(/```drawing\n([\s\S]*?)\n```/g) || []
      return drawingBlocks.map(block => {
        const match = block.match(/```drawing\n([\s\S]*?)\n```/)
        return match ? match[1] : ''
      }).filter(Boolean)
    }, [newNote.content])

    const formatButtons = [
      { icon: Bold, action: () => formatText('bold'), label: 'Bold', shortcut: 'Ctrl+B' },
      { icon: Italic, action: () => formatText('italic'), label: 'Italic', shortcut: 'Ctrl+I' },
      { icon: Code, action: () => formatText('code'), label: 'Code', shortcut: 'Ctrl+`' },
      { icon: Heading1, action: () => formatText('h1'), label: 'H1', shortcut: 'Ctrl+Shift+1' },
      { icon: Heading2, action: () => formatText('h2'), label: 'H2', shortcut: 'Ctrl+Shift+2' },
      { icon: Heading3, action: () => formatText('h3'), label: 'H3', shortcut: 'Ctrl+Shift+3' },
      { icon: Quote, action: () => formatText('quote'), label: 'Quote', shortcut: 'Ctrl+Shift+Q' },
      { icon: List, action: () => formatText('ul'), label: 'Bullet List', shortcut: 'Ctrl+Shift+U' },
      { icon: ListOrdered, action: () => formatText('ol'), label: 'Numbered List', shortcut: 'Ctrl+Shift+O' },
    ]

    if (!isOpen) return null

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{
              duration: 0.15,
              type: "spring",
              stiffness: 500,
              damping: 35,
              mass: 0.8,
            }}
            className="glass-modal rounded-3xl p-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <motion.h2
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.02, duration: 0.12 }}
                className="text-3xl font-medium text-slate-800"
              >
                {editingNote ? "Edit Note" : "New Note"}
              </motion.h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-orange-600 transition-colors duration-150"
                  title="Show keyboard shortcuts (Ctrl+/)"
                >
                  <span className="text-sm">Shortcuts</span>
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 600, damping: 25, mass: 0.5 }}
                >
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-orange-600 transition-colors duration-150"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Keyboard Shortcuts Panel */}
            {showShortcuts && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200"
              >
                <h3 className="text-lg font-medium text-slate-700 mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+B</kbd> Bold</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+I</kbd> Italic</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+`</kbd> Code</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+1</kbd> Heading 1</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+2</kbd> Heading 2</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+3</kbd> Heading 3</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+Q</kbd> Quote</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+U</kbd> Bullet List</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+O</kbd> Numbered List</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+Shift+D</kbd> Add Drawing</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Ctrl+S</kbd> Save Note</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border text-xs">Esc</kbd> Close</div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.12 }}
              className="space-y-8"
            >
              <Input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl font-medium bg-transparent border-0 border-b border-slate-200 rounded-none px-0 py-4 focus:border-orange-400 focus:ring-0 focus:ring-offset-0 text-slate-800 transition-colors duration-200 font-sans not-italic"
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-700">Write</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={insertDrawingAtCursor}
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-orange-600 flex items-center gap-2"
                        title="Add Drawing (Ctrl+Shift+D)"
                      >
                        <PenTool className="w-4 h-4" />
                        Drawing
                      </Button>
                    </div>
                  </div>

                  {/* Format Toolbar */}
                  <div className="flex flex-wrap gap-1 mb-3 p-2 bg-slate-50/50 rounded-xl border border-slate-200">
                    {formatButtons.map((button, index) => (
                      <Button
                        key={index}
                        onClick={button.action}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                        title={`${button.label} (${button.shortcut})`}
                      >
                        <button.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                  
                  <Textarea
                    ref={textareaRef}
                    placeholder="Start writing your thoughts... Use keyboard shortcuts for quick formatting!"
                    value={newNote.content}
                    onChange={onContentChange}
                    className="h-[400px] max-h-[400px] bg-transparent border border-slate-200 rounded-2xl resize-none text-lg leading-relaxed focus:ring-0 focus:ring-offset-0 p-6 text-slate-700 placeholder:text-slate-400 font-sans focus:border-orange-400 transition-colors duration-200 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300/50 hover:scrollbar-thumb-slate-400/70 overflow-y-auto"
                  />
                </div>

                <div className="relative hidden xl:block">
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Preview</h3>
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto border border-slate-200 rounded-2xl p-6 bg-slate-50/30 preview-mode scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300/50 hover:scrollbar-thumb-slate-400/70">
                    {newNote.title && (
                      <h1 className="text-2xl font-bold text-slate-800 mb-6 font-sans">{newNote.title}</h1>
                    )}
                    {previewContent ? (
                      <div
                        className="text-slate-700 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: previewContent }}
                      />
                    ) : (
                      <p className="text-slate-400 italic font-sans">Start writing to see preview...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawings Section - Show drawings embedded in content */}
              {parsedDrawings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-700">Drawings in this note</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedDrawings.map((drawing, index) => (
                      <DrawingViewer
                        key={`parsed-${index}`}
                        drawingData={drawing}
                        onEdit={() => {
                          // Find and edit the drawing in content
                          setEditingDrawingIndex(index)
                          setShowDrawingModal(true)
                        }}
                        onDelete={() => {
                          // Remove drawing block from content
                          const drawingBlock = `\`\`\`drawing\n${drawing}\n\`\`\``
                          const updatedContent = newNote.content.replace(drawingBlock, '')
                          const event = {
                            target: { value: updatedContent }
                          } as React.ChangeEvent<HTMLTextAreaElement>
                          onContentChange(event)
                        }}
                        isPreview={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                >
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-slate-500 hover:text-orange-700 px-6 py-3 transition-colors duration-150"
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                >
                  <Button
                    onClick={onSave}
                    disabled={isDisabled}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-8 py-3 disabled:opacity-50 transition-all duration-150"
                    title="Save Note (Ctrl+S)"
                  >
                    {editingNote ? "Update Note" : "Save Note"}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Excalidraw Modal */}
        <ExcalidrawModal
          isOpen={showDrawingModal}
          onClose={() => {
            setShowDrawingModal(false)
            setEditingDrawingIndex(null)
          }}
          onSave={handleSaveDrawing}
          initialData={
            editingDrawingIndex !== null && parsedDrawings[editingDrawingIndex]
              ? parsedDrawings[editingDrawingIndex]
              : undefined
          }
        />
      </>
    )
  },
)

NoteEditor.displayName = "NoteEditor"

export default NoteEditor