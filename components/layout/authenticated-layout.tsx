"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { AuthenticatedHeader } from "./authenticated-header"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  onCartClick?: () => void
}

export function AuthenticatedLayout({ children, onCartClick }: AuthenticatedLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect non-authenticated users to home
    if (!user && !isLoading) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader onCartClick={onCartClick} />
      <main>{children}</main>
    </div>
  )
}
