"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppTopbar />
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}