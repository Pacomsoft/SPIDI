"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authProvider, initSessionRepository } from "@/lib/auth"
import { canAccessModule, type ModuleKey } from "@/lib/roles"

interface RoleGuardProps {
  moduleKey: ModuleKey
  children: React.ReactNode
}

export function RoleGuard({ moduleKey, children }: RoleGuardProps) {
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      await initSessionRepository()
      const session = authProvider.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      const hasAccess = canAccessModule(session.role, moduleKey)
      if (!hasAccess) {
        router.push("/denied")
      }
    }
    checkAccess()
  }, [moduleKey, router])

  return <>{children}</>
}
