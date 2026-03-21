"use client"

import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const moduleKey = "CONTRATOS"

export default function ContratosPage() {
  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gestión de contratos y documentos legales
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Módulo de Contratos</CardTitle>
            <CardDescription>
              Vista principal de contratos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contenido del módulo de contratos...
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
