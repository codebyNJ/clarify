"use client"

import { createContext, useContext, ReactNode } from "react"

interface User {
  uid: string
  email: string | null
  displayName: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

// Mock user for development without authentication
const mockUser: User = {
  uid: "local-user",
  email: "user@local.dev",
  displayName: "Local User",
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always provide mock user - no authentication
  const user = mockUser
  const loading = false

  const logout = async () => {
    // No-op since there's no real authentication
    console.log("Logout called (no-op in dev mode)")
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
