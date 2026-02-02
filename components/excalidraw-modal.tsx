"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Download, FileJson, Image, Save, X } from "lucide-react"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"

// Import Excalidraw dynamically with no SSR
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => ({ default: mod.Excalidraw })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading drawing canvas...</div>
      </div>
    )
  }
)

interface ExcalidrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (drawingData: string) => void
  initialData?: string
}

const ExcalidrawModal = React.memo<ExcalidrawModalProps>(({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoaded(true)
    } else {
      // Reset state when modal closes
      setIsLoaded(false)
      setExcalidrawAPI(null)
    }
  }, [isOpen])

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) {
      console.warn('Excalidraw API not available, saving empty drawing')
      onSave(JSON.stringify({ elements: [], appState: {} }))
      onClose()
      return
    }

    try {
      setIsSaving(true)
      
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()

      console.log('Saving drawing with', elements.length, 'elements')

      // Create a clean drawing data object
      const drawingData = {
        elements: elements || [],
        appState: {
          viewBackgroundColor: appState?.viewBackgroundColor || "#ffffff",
          gridSize: appState?.gridSize || null,
          scrollX: appState?.scrollX || 0,
          scrollY: appState?.scrollY || 0,
          zoom: appState?.zoom || { value: 1 },
          theme: appState?.theme || "light",
        }
      }

      const jsonString = JSON.stringify(drawingData, null, 0)
      console.log('Drawing data size:', jsonString.length, 'characters')
      
      onSave(jsonString)
      onClose()
    } catch (error) {
      console.error('Error saving drawing:', error)
      // Save empty drawing data if there's an error
      onSave(JSON.stringify({ 
        elements: [], 
        appState: {
          viewBackgroundColor: "#ffffff",
          gridSize: null,
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 },
          theme: "light"
        } 
      }))
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [excalidrawAPI, onSave, onClose])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const getSceneForExport = useCallback(() => {
    if (!excalidrawAPI) {
      return {
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light",
        },
      }
    }

    const elements = excalidrawAPI.getSceneElements() || []
    const appState = excalidrawAPI.getAppState()

    return {
      elements,
      appState: {
        viewBackgroundColor: appState?.viewBackgroundColor || "#ffffff",
        theme: appState?.theme || "light",
        exportBackground: true,
        exportWithDarkMode: false,
      },
    }
  }, [excalidrawAPI])

  const handleDownloadPNG = useCallback(async () => {
    try {
      setIsExporting(true)
      const { exportToCanvas } = await import("@excalidraw/excalidraw")
      const { elements, appState } = getSceneForExport()
      const canvas = await exportToCanvas({
        elements,
        appState: { ...appState, exportScale: 2 },
        files: null,
        maxWidthOrHeight: 4000,
        exportPadding: 20,
      })

      canvas.toBlob((blob) => {
        if (!blob) return
        downloadBlob(blob, "drawing.png")
      }, "image/png")
    } catch (error) {
      console.error("Error exporting PNG:", error)
    } finally {
      setIsExporting(false)
    }
  }, [downloadBlob, getSceneForExport])

  const handleDownloadSVG = useCallback(async () => {
    try {
      setIsExporting(true)
      const { exportToSvg } = await import("@excalidraw/excalidraw")
      const { elements, appState } = getSceneForExport()
      const svg = await exportToSvg({
        elements,
        appState: { ...appState, exportScale: 1 },
        files: null,
        exportPadding: 20,
      })

      const svgString = new XMLSerializer().serializeToString(svg)
      downloadBlob(new Blob([svgString], { type: "image/svg+xml" }), "drawing.svg")
    } catch (error) {
      console.error("Error exporting SVG:", error)
    } finally {
      setIsExporting(false)
    }
  }, [downloadBlob, getSceneForExport])

  const handleDownloadJSON = useCallback(async () => {
    try {
      setIsExporting(true)
      const { elements, appState } = getSceneForExport()
      const payload = JSON.stringify({ elements, appState }, null, 2)
      downloadBlob(new Blob([payload], { type: "application/json" }), "drawing.excalidraw.json")
    } catch (error) {
      console.error("Error exporting JSON:", error)
    } finally {
      setIsExporting(false)
    }
  }, [downloadBlob, getSceneForExport])

  const parseInitialData = useCallback(() => {
    if (!initialData) return undefined
    
    try {
      const parsed = JSON.parse(initialData)
      console.log('Loading initial data with', parsed.elements?.length || 0, 'elements')
      
      return {
        elements: parsed.elements || [],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light",
          ...parsed.appState,
        }
      }
    } catch (error) {
      console.error("Error parsing initial data:", error)
      return {
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light"
        }
      }
    }
  }, [initialData])

  const handleExcalidrawAPI = useCallback((api: any) => {
    console.log('Excalidraw API initialized:', !!api)
    setExcalidrawAPI(api)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? e.metaKey : e.ctrlKey
    
    if (modifier && e.key === 's') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [isOpen, handleSave, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
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
        className="bg-white rounded-3xl w-full max-w-7xl h-[90vh] overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white relative z-10 h-16">
          <h2 className="text-xl font-medium text-slate-800">Drawing Canvas</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownloadPNG}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900"
              disabled={isSaving || isExporting}
              title="Download PNG"
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDownloadSVG}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900"
              disabled={isSaving || isExporting}
              title="Download SVG"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDownloadJSON}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900"
              disabled={isSaving || isExporting}
              title="Download JSON"
            >
              <FileJson className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isExporting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Drawing
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-orange-600"
              disabled={isSaving || isExporting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Excalidraw Container */}
        <div className="w-full bg-white" style={{ height: "calc(90vh - 64px)" }}>
          {isLoaded && (
            <Excalidraw
              excalidrawAPI={handleExcalidrawAPI}
              initialData={parseInitialData()}
              UIOptions={{
                canvasActions: {
                  saveToActiveFile: false,
                  loadScene: false,
                  export: { saveFileToDisk: true },
                  saveAsImage: true,
                },
                tools: {
                  image: false,
                },
              }}
              theme="light"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
})

ExcalidrawModal.displayName = "ExcalidrawModal"

export default ExcalidrawModal