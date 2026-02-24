"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authProvider } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authProvider.isAuthenticated()

      if (!isAuthenticated) {
        // Guardar la ruta actual para redirigir después del login
        if (typeof window !== "undefined") {
          sessionStorage.setItem("redirect_after_login", pathname)
        }
        router.push("/login")
      } else {
        // Renovar sesión en cada chequeo
        authProvider.renewSession()
      }
    }

    checkAuth()

    // Verificar autenticación cada 5 minutos
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [router, pathname])

  // Solo renderizar si está autenticado
  if (!authProvider.isAuthenticated()) {
    return null
  }

  return <>{children}</>
}
