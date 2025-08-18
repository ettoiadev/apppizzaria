"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { PDVManagement } from "@/components/admin/pdv/pdv-management"

export default function AdminPDVPage() {
  return (
    <AdminLayout>
      <PDVManagement />
    </AdminLayout>
  )
}