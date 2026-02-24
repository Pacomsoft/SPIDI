"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authProvider } from "@/lib/auth"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const isAuthenticated = authProvider.isAuthenticated()

    if (isAuthenticated) {
      // Si está autenticado, redirigir al home
      router.push("/home")
    } else {
      // Si no está autenticado, redirigir al login
      router.push("/login")
    }
  }, [router])

  // Mostrar un loading mientras redirige
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
