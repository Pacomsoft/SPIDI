"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authProvider } from "@/lib/auth"
import { canAccessModule, type ModuleKey } from "@/lib/roles"

interface RoleGuardProps {
  moduleKey: ModuleKey
  children: React.ReactNode
}

export function RoleGuard({ moduleKey, children }: RoleGuardProps) {
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    const session = authProvider.getSession()
    if (!session) {
      router.push("/login")
      return
    }

    // Verificar permisos de acceso al módulo
    const hasAccess = canAccessModule(session.role, moduleKey)
    if (!hasAccess) {
      router.push("/denied")
      return
    }
  }, [moduleKey, router])

  return <>{children}</>
}
