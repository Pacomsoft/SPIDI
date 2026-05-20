"use client"

import { AuthGuard } from "@/modules/login/application/presentation/components/auth-guard"
import { createEnsureTokenValidUseCase } from "@/modules/login/infrastructure/dependency-injection"
import { createAdmModule } from "@/modules/adm/infrastructure/dependency-injection"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/modules/adm/application/presentation/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { GuardPage } from "@/modules/adm/application/presentation/components/guard-page"
import { ModuleAccessProvider } from "@/modules/adm/application/presentation/components/module-access-provider"
import { NavigationLoadingWatcher } from "@/modules/shared/application/presentation/components/navigation-loading-watcher"

const ensureTokenValidUseCase = createEnsureTokenValidUseCase()
const admModule = createAdmModule()

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard ensureTokenValidUseCase={ensureTokenValidUseCase}>
      <ModuleAccessProvider
        getSessionInfoUseCase={admModule.useCases.getSessionInfo}
        checkModuleAccessUseCase={admModule.useCases.checkModuleAccess}
      >
        <SidebarProvider defaultOpen>
          <AppSidebar sessionPort={admModule.sessionAdapter} />
          <SidebarInset className="flex flex-col h-svh z-0">
            <NavigationLoadingWatcher />
            <AppTopbar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
              <GuardPage>
                {children}
              </GuardPage>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ModuleAccessProvider>
    </AuthGuard>
  )
}