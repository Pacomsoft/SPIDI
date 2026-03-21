"use client"

import { useRouter } from "next/navigation"
import { authProvider } from "@/lib/auth"
import { type Role } from "@/lib/roles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Clock, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminHomePage() {
  const router = useRouter()
  const [session, setSession] = useState<{
    userName: string
    userRole: string
    role: Role
    expiresAt: number
  } | null>(null)

  useEffect(() => {
    const currentSession = authProvider.getSession()
    if (currentSession) {
      setSession(currentSession)
    }
  }, [])

  const handleLogout = () => {
    authProvider.logout()
    router.push("/login")
  }

  const handleRoleChange = (newRole: Role) => {
    authProvider.setRole(newRole)
    const updatedSession = authProvider.getSession()
    if (updatedSession) {
      setSession(updatedSession)
    }
    // Recargar la página para actualizar el sidebar
    window.location.reload()
  }

  const formatExpiration = (timestamp: number) => {
    const hours = Math.floor((timestamp - Date.now()) / (1000 * 60 * 60))
    const minutes = Math.floor(((timestamp - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const roles: Array<{ value: Role; label: string; description: string }> = [
    { value: "ADMIN_TI", label: "Admin TI", description: "Acceso completo a todos los módulos" },
    { value: "ADMIN_OPERACIONES", label: "Admin Operaciones", description: "Todos excepto Pagos (vista limitada)" },
    { value: "FINANZAS", label: "Finanzas", description: "Solo Drivers y Pagos" },
    { value: "RH", label: "RH", description: "Drivers, Comunicación, Capacitación, Contratos" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Panel de administración</p>
        </div>
        <Button onClick={handleLogout} variant="destructive" size="lg">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm font-semibold">
                  MODO MOCK
                </Badge>
                Sesión Iniciada
              </CardTitle>
              <CardDescription>
                Autenticación simulada para desarrollo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                <p className="text-base font-semibold">{session?.userName || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <p className="text-base font-semibold">{session?.role || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expira en</p>
                <p className="text-base font-semibold">
                  {session ? formatExpiration(session.expiresAt) : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Nota para desarrollo:</strong> Esta es una sesión simulada. En producción,
              el botón &quot;Iniciar sesión&quot; redirigirá a App Directory para autenticación SSO real.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Selector de Rol (Demo)
          </CardTitle>
          <CardDescription>
            Cambia de rol para probar el sistema de permisos y módulos visibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {roles.map((role) => (
              <Button
                key={role.value}
                variant={session?.role === role.value ? "default" : "outline"}
                className="h-auto flex-col items-start gap-1 p-4 text-left"
                onClick={() => handleRoleChange(role.value)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold">{role.label}</span>
                  {session?.role === role.value && (
                    <Badge variant="secondary" className="text-xs">
                      Actual
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {role.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos pasos</CardTitle>
          <CardDescription>Integración con App Directory</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary">→</span>
              <span>
                Configurar variables de entorno para App Directory (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_APP_DIRECTORY_URL
                </code>
                )
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary">→</span>
              <span>Implementar callback para recibir token de autenticación</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary">→</span>
              <span>Reemplazar sesión mock con token real de App Directory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary">→</span>
              <span>Agregar manejo de errores y renovación de tokens</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
