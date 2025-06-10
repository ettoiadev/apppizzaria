"use client"

import type React from "react"
import { AdminHeader } from "./admin-header"
import { AdminTabs } from "./admin-tabs"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs />

      <main className="container mx-auto px-6 py-6">{children}</main>
    </div>
  )
}
