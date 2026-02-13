"use client"

import { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Authentication disabled - render children directly
  return <>{children}</>
}
