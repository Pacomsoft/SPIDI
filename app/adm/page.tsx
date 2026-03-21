"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authProvider } from "@/lib/auth"
import { getHomePageForRole } from "@/lib/roles"

export default function AdminRootPage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si está autenticado
    const session = authProvider.getSession()
    
    if (!session) {
      // Si no está autenticado, redirigir a login
      router.replace("/login")
      return
    }

    // Si está autenticado, redirigir a la página home según el rol
    const homePage = getHomePageForRole(session.role)
    router.replace(homePage)
  }, [router])

  return null
}
