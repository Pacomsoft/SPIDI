"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authProvider } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Phone } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      // Iniciar proceso de login SSO (mock)
      await authProvider.startLogin()

      // Verificar si hay una ruta guardada para redirigir
      const redirectPath =
        typeof window !== "undefined"
          ? sessionStorage.getItem("redirect_after_login")
          : null

      // Redirigir al home o a la ruta guardada
      router.push(redirectPath || "/home")

      // Limpiar la ruta guardada
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("redirect_after_login")
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="text-3xl font-bold text-primary-foreground">S</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Te damos la bienvenida
          </CardTitle>
          <CardDescription className="text-base">
            Inicia sesión con tu cuenta corporativa para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirigiendo...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Serás redirigido a App Directory para autenticarte de forma segura.
          </p>

          {/* Separador con texto */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ¿Necesitas ayuda?
              </span>
            </div>
          </div>

          {/* Sección de contacto */}
          <div className="flex items-center justify-center gap-4 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
              <Phone className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Comunícate con nosotros</p>
              <p className="text-sm text-muted-foreground">
                (81) 1234-5678 ext. 1234
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
