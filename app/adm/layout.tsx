"use client"

import { AuthGuard } from "@/modules/login/application/presentation/components/auth-guard"
import { createEnsureTokenValidUseCase } from "@/modules/login/infrastructure/dependency-injection"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"

const ensureTokenValidUseCase = createEnsureTokenValidUseCase()

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard ensureTokenValidUseCase={ensureTokenValidUseCase}>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppTopbar />
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}