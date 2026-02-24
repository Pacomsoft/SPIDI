"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2
} from "lucide-react"

const moduleKey = "CAPACITACION"

// Tipos
type TrainingType = "Obligatorio" | "Opcional" | "Política de empresa"
type SortKey = "id" | "title" | "type" | "createdAt"
type SortDirection = "asc" | "desc"
type ExportFormat = "csv" | "excel"
type ExportScope = "current" | "all"

interface TrainingListItem {
  id: string
  title: string
  type: TrainingType
  createdAt: string
}

// Generar datos dummy
const generateDummyTrainings = (count: number): TrainingListItem[] => {
  const types: TrainingType[] = ["Obligatorio", "Opcional", "Política de empresa"]
  
  const titulosObligatorios = [
    "Seguridad vial básica",
    "Manejo defensivo",
    "Primeros auxilios",
    "Prevención de accidentes",
    "Manejo de carga peligrosa",
    "Normativa de transporte",
    "Uso de equipo de protección",
    "Procedimientos de emergencia",
    "Inspección pre-viaje",
    "Mecánica básica del vehículo",
    "Mantenimiento preventivo",
    "Documentación y reportes",
    "Comunicación con central",
    "Manejo en condiciones adversas",
    "Ergonomía del conductor"
  ]

  const titulosOpcionales = [
    "Atención al cliente",
    "Gestión del tiempo",
    "Resolución de conflictos",
    "Técnicas de conducción eficiente",
    "Ahorro de combustible",
    "Uso de tecnología GPS",
    "Idiomas básicos",
    "Manejo de estrés",
    "Trabajo en equipo",
    "Liderazgo operativo",
    "Mejora continua",
    "Calidad en el servicio"
  ]

  const titulosPolitica = [
    "Código de ética empresarial",
    "Prevención de acoso laboral",
    "Protección de datos personales",
    "Política de no discriminación",
    "Uso apropiado de recursos",
    "Política ambiental",
    "Integridad y anticorrupción",
    "Normas de convivencia",
    "Responsabilidad social",
    "Cultura organizacional"
  ]

  const trainings: TrainingListItem[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const typeIndex = i % 3
    const type = types[typeIndex]
    
    let title = ""
    if (type === "Obligatorio") {
      title = titulosObligatorios[i % titulosObligatorios.length]
    } else if (type === "Opcional") {
      title = titulosOpcionales[i % titulosOpcionales.length]
    } else {
      title = titulosPolitica[i % titulosPolitica.length]
    }

    // Asegurar títulos únicos agregando número si es necesario
    if (i >= 30) {
      title = `${title} - Nivel ${Math.floor(i / 30) + 1}`
    }

    const daysAgo = Math.floor(Math.random() * 365)
    const createdDate = new Date(now)
    createdDate.setDate(createdDate.getDate() - daysAgo)

    trainings.push({
      id: `CAP-${String(1000 + i).padStart(4, '0')}`,
      title,
      type,
      createdAt: createdDate.toISOString()
    })
  }

  return trainings
}

const ALL_TRAININGS = generateDummyTrainings(85)

export default function CapacitacionPage() {
  const router = useRouter()
  
  // Estados
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [showError, setShowError] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Simular carga inicial
  useEffect(() => {
    setLoading(true)
    const delay = Math.floor(Math.random() * 300) + 500
    const timer = setTimeout(() => {
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  // Simular lazy loading en cambios
  useEffect(() => {
    if (!loading) {
      setLoading(true)
      const delay = Math.floor(Math.random() * 300) + 500
      const timer = setTimeout(() => {
        setLoading(false)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [sortKey, sortDirection, currentPage, itemsPerPage])

  // Ordenamiento
  const sortedTrainings = useMemo(() => {
    const sorted = [...ALL_TRAININGS].sort((a, b) => {
      let aVal: string | number = a[sortKey]
      let bVal: string | number = b[sortKey]

      if (sortKey === "createdAt") {
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [sortKey, sortDirection])

  // Paginación
  const totalPages = Math.ceil(sortedTrainings.length / itemsPerPage)
  const paginatedTrainings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedTrainings.slice(start, end)
  }, [sortedTrainings, currentPage, itemsPerPage])

  // Handlers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value) as 25 | 50 | 100)
    setCurrentPage(1)
  }

  const handleExport = (format: ExportFormat, scope: ExportScope) => {
    const dataToExport = scope === "current" ? paginatedTrainings : sortedTrainings
    
    if (format === "csv") {
      const headers = ["ID", "Título", "Tipo", "Fecha de creación"]
      const rows = dataToExport.map(t => [
        t.id,
        `"${t.title}"`,
        t.type,
        new Date(t.createdAt).toLocaleDateString('es-MX')
      ])
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `capacitaciones_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else {
      console.log("Exportación Excel simulada:", { format, scope, records: dataToExport.length })
    }

    alert("Exportación generada correctamente")
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

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

  // Estado de error (toggle dummy)
  if (showError) {
    return (
      <RoleGuard moduleKey={moduleKey}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Capacitaciones</h1>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar las capacitaciones. Intenta nuevamente.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={() => setShowError(false)}>
              Reintentar
            </Button>
          </div>
        </div>
      </RoleGuard>
    )
  }

  // Estado vacío
  if (!loading && sortedTrainings.length === 0) {
    return (
      <RoleGuard moduleKey={moduleKey}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Capacitaciones</h1>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <GraduationCap className="h-16 w-16 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                No hay capacitaciones creadas.
              </p>
              <Button onClick={() => {
                setLoadingCreate(true)
                router.push("/capacitacion/create")
              }}>
                <BookOpen className="mr-2 h-4 w-4" />
                Crear capacitación
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Capacitaciones</h1>
          <div className="flex items-center gap-3">
            {/* Toggle error (dummy) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowError(true)}
              className="text-xs text-muted-foreground"
            >
              Simular error
            </Button>
            <Button onClick={() => {
              setLoadingCreate(true)
              router.push("/capacitacion/create")
            }}>
              <BookOpen className="mr-2 h-4 w-4" />
              Crear capacitación
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  Listado de capacitaciones
                </h2>
              </div>
              
              {/* Exportar */}
              <Select
                onValueChange={(value) => {
                  const [format, scope] = value.split("-") as [ExportFormat, ExportScope]
                  handleExport(format, scope)
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Download className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Exportar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv-current">CSV - Página actual</SelectItem>
                  <SelectItem value="csv-all">CSV - Todas</SelectItem>
                  <SelectItem value="excel-current">Excel - Página actual</SelectItem>
                  <SelectItem value="excel-all">Excel - Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Cargando capacitaciones...
                </p>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("id")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        ID
                        <SortIcon column="id" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("title")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Título
                        <SortIcon column="title" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("type")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Tipo
                        <SortIcon column="type" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("createdAt")}
                        className="hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Fecha de creación
                        <SortIcon column="createdAt" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrainings.map((training) => (
                    <TableRow
                      key={training.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setLoadingDetail(true)
                        router.push(`/capacitacion/${training.id}`)
                      }}
                    >
                      <TableCell className="font-mono text-sm">
                        {training.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {training.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(training.type)}>
                          {training.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(training.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Paginación */}
          {!loading && (
            <div className="border-t bg-muted/30 px-4 sm:px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Registros por página:
                    </span>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} • Total: {sortedTrainings.length} capacitaciones
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Overlay de loading al crear capacitación */}
        {loadingCreate && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando formulario de creación...</p>
            </div>
          </div>
        )}

        {/* Overlay de loading al navegar a detalle */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando detalle de la capacitación...</p>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
