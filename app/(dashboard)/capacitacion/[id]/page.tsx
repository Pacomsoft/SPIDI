"use client"

import { use } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Calendar, Tag } from "lucide-react"
import { useRouter } from "next/navigation"

const moduleKey = "CAPACITACION"

type TrainingType = "Obligatorio" | "Opcional" | "Política de empresa"

interface TrainingDetail {
  id: string
  title: string
  type: TrainingType
  createdAt: string
  description: string
}

// Función para generar detalle dummy basado en ID
const getTrainingDetail = (id: string): TrainingDetail => {
  return {
    id,
    title: "Seguridad vial básica",
    type: "Obligatorio",
    createdAt: new Date().toISOString(),
    description: "Curso de seguridad vial para conductores de última milla"
  }
}

export default function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const training = getTrainingDetail(id)

  const getTypeVariant = (type: TrainingType) => {
    switch (type) {
      case "Obligatorio":
        return "destructive"
      case "Opcional":
        return "default"
      case "Política de empresa":
        return "secondary"
    }
  }

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/capacitacion')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{training.title}</h1>
            <p className="text-muted-foreground">Detalle de la capacitación</p>
          </div>
          <Badge variant={getTypeVariant(training.type)}>
            {training.type}
          </Badge>
        </div>

        {/* Info básica */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Información general</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Tag className="h-4 w-4" />
                  <span>ID</span>
                </div>
                <p className="font-mono text-sm">{training.id}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de creación</span>
                </div>
                <p className="text-sm">
                  {new Date(training.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder para contenido adicional */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Contenido del curso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg text-muted-foreground text-center">
              Contenido de la capacitación en desarrollo...
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Aquí se mostrará el contenido completo, módulos, evaluaciones, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
