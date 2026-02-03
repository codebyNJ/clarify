"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/notes")
      } else {
        router.push("/auth/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting...</p>
      </div>
    </div>
  )
}
