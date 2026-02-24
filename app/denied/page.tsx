"use client"

import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeniedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            No tienes permisos para acceder a este módulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Tu rol actual no incluye acceso a esta sección del sistema. Si crees que esto es un error, contacta al administrador.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/home")} className="w-full" size="lg">
            Volver al Inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
