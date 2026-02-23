"use client"

import { useEffect, useState } from "react"
import { WifiOff, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Check if we're online
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Reload to get fresh content
      window.location.href = "/"
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#E8613A] rounded-2xl flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            {isOnline ? "Reconnecting..." : "You're Offline"}
          </h1>
          <p className="text-gray-400 text-lg">
            {isOnline
              ? "Your connection has been restored. Reloading..."
              : "It looks like you've lost your internet connection."}
          </p>
        </div>

        {/* Information */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Clarify works offline for viewing cached notes. Any edits you make will be saved
            locally and synced automatically when you're back online.
          </p>

          {!isOnline && (
            <div className="pt-2">
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-[#E8613A] hover:bg-[#d14f28] text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-left space-y-3">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            While offline, you can:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#E8613A] mt-1">•</span>
              <span>View previously loaded notes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E8613A] mt-1">•</span>
              <span>Create and edit notes (will sync when online)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E8613A] mt-1">•</span>
              <span>Navigate between cached pages</span>
            </li>
          </ul>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          />
          <span>{isOnline ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
    </div>
  )
}
