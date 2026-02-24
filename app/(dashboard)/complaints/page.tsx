"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  FilterX,
  Loader2
} from "lucide-react"

const moduleKey = "COMUNICACION"

// Tipos
type ComplaintType = "Queja" | "Aclaración" | "Comentario"
type ComplaintStatus = "Nueva" | "En proceso" | "Resuelta"
type SortKey = "id" | "driverName" | "type" | "receivedAt" | "status" | "updatedAt"
type SortDirection = "asc" | "desc"

interface ComplaintItem {
  id: string
  driverId: string
  driverName: string
  driverRfc: string
  driverEmail: string
  type: ComplaintType
  receivedAt: string
  updatedAt: string
  status: ComplaintStatus
}

interface FilterState {
  id: string
  driverTerm: string
  updatedAtRange: DateRange | undefined
  types: ComplaintType[]
  statuses: ComplaintStatus[]
}

// Generar datos dummy
const generateDummyComplaints = (count: number): ComplaintItem[] => {
  const types: ComplaintType[] = ["Queja", "Aclaración", "Comentario"]
  const statuses: ComplaintStatus[] = ["Nueva", "En proceso", "Resuelta"]
  
  const nombres = [
    "Juan Pérez García", "María González López", "Carlos Rodríguez Martínez",
    "Ana Hernández Díaz", "Luis Torres Ramírez", "Patricia Flores Morales",
    "Roberto Martínez Silva", "Laura Sánchez Cruz", "José López Herrera",
    "Carmen Gómez Ruiz", "Francisco Díaz Castro", "Isabel Morales Ortiz",
    "Miguel Jiménez Vargas", "Rosa Méndez Reyes", "Pedro Castro Núñez",
    "Gabriela Ruiz Domínguez", "Antonio Moreno Aguilar", "Elena Gutiérrez Ramos",
    "Jorge Ramírez Santos", "Sofía Ortiz Medina", "Daniel Navarro Vega",
    "Mónica Cruz Delgado", "Ricardo Vega Campos", "Lucía Delgado Rojas"
  ]

  const complaints: ComplaintItem[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 180) // Últimos 6 meses
    const receivedDate = new Date(now)
    receivedDate.setDate(receivedDate.getDate() - daysAgo)
    receivedDate.setHours(Math.floor(Math.random() * 24))
    receivedDate.setMinutes(Math.floor(Math.random() * 60))

    // Updated date es más reciente que received date
    const updatedDaysAgo = Math.floor(Math.random() * daysAgo)
    const updatedDate = new Date(now)
    updatedDate.setDate(updatedDate.getDate() - updatedDaysAgo)
    updatedDate.setHours(Math.floor(Math.random() * 24))
    updatedDate.setMinutes(Math.floor(Math.random() * 60))

    const nombre = nombres[i % nombres.length]
    const rfcBase = nombre.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
    const rfc = `${rfcBase}${String(800101 + i).slice(-6)}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 2) % 26))}${i % 10}`
    const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@email.com`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    complaints.push({
      id: `QA-${String(1000 + i).padStart(4, '0')}`,
      driverId: `DRV-${String(100 + (i % 24)).padStart(3, '0')}`,
      driverName: nombre,
      driverRfc: rfc,
      driverEmail: email,
      type: types[Math.floor(Math.random() * types.length)],
      receivedAt: receivedDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  }

  return complaints
}

const ALL_COMPLAINTS = generateDummyComplaints(237) // Total de registros

// Funciones auxiliares de normalización y búsqueda
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // Quitar puntuación
    .trim()
}

// Búsqueda inteligente que prueba múltiples modos automáticamente
const matchTextIntelligent = (text: string, searchTerm: string): boolean => {
  if (!searchTerm) return true

  const normalizedText = normalizeText(text)
  const normalizedSearch = normalizeText(searchTerm)

  // Modo 1: Exacta (case sensitive)
  if (text === searchTerm) return true

  // Modo 2: Exacta (normalizada)
  if (normalizedText === normalizedSearch) return true

  // Modo 3: Prefijo (term%)
  if (normalizedText.startsWith(normalizedSearch)) return true

  // Modo 4: Sufijo (%term)
  if (normalizedText.endsWith(normalizedSearch)) return true

  // Modo 5: Contiene (%term%)
  if (normalizedText.includes(normalizedSearch)) return true

  // Modo 6: Fuzzy ≥ 85% (contiene la mayoría de caracteres)
  const searchChars = normalizedSearch.split('').filter(c => c !== ' ')
  const matchedChars = searchChars.filter(char => normalizedText.includes(char))
  if (searchChars.length > 0 && (matchedChars.length / searchChars.length) >= 0.85) {
    return true
  }

  return false
}

const getStatusBadgeVariant = (status: ComplaintStatus) => {
  switch (status) {
    case "Nueva":
      return "destructive"
    case "En proceso":
      return "default"
    case "Resuelta":
      return "secondary"
  }
}

const getTypeBadgeVariant = (type: ComplaintType) => {
  switch (type) {
    case "Queja":
      return "destructive"
    case "Aclaración":
      return "default"
    case "Comentario":
      return "outline"
  }
}

export default function ComplaintsPage() {
  const router = useRouter()
  
  // Estados
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showError, setShowError] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'receivedAt',
    direction: 'desc'
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Estados de filtros con defaults
  const [filters, setFilters] = useState<FilterState>({
    id: "",
    driverTerm: "",
    updatedAtRange: undefined,
    types: [],
    statuses: ["Nueva", "En proceso"] // Default filter
  })

  // Control de debounce para inputs de texto
  const [debouncedId, setDebouncedId] = useState("")
  const [debouncedDriverTerm, setDebouncedDriverTerm] = useState("")

  // Debounce para ID
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedId(filters.id)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.id])

  // Debounce para Driver
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDriverTerm(filters.driverTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.driverTerm])

  // Cargar datos con simulación de loading
  const loadData = async () => {
    setLoading(true)
    
    // Simular delay de red (500-800ms)
    const delay = 500 + Math.random() * 300
    await new Promise(resolve => setTimeout(resolve, delay))
    
    setComplaints(ALL_COMPLAINTS)
    setLoading(false)
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Recargar cuando cambian filtros, sort, page o pageSize
  useEffect(() => {
    if (complaints.length > 0) {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [debouncedId, debouncedDriverTerm, filters.updatedAtRange, filters.types, filters.statuses, sort, page, pageSize])

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1)
  }, [debouncedId, debouncedDriverTerm, filters.updatedAtRange, filters.types, filters.statuses])

  // Aplicar filtros
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      // Filtro por ID (contiene)
      if (debouncedId && !complaint.id.toLowerCase().includes(debouncedId.toLowerCase())) {
        return false
      }

      // Filtro por Driver (nombre o RFC) con búsqueda inteligente
      if (debouncedDriverTerm) {
        const matchesName = matchTextIntelligent(complaint.driverName, debouncedDriverTerm)
        const matchesRfc = matchTextIntelligent(complaint.driverRfc, debouncedDriverTerm)
        if (!matchesName && !matchesRfc) {
          return false
        }
      }

      // Filtro por rango de fechas (updatedAt)
      if (filters.updatedAtRange?.from) {
        const updatedDate = new Date(complaint.updatedAt)
        const fromDate = new Date(filters.updatedAtRange.from)
        fromDate.setHours(0, 0, 0, 0)
        
        if (updatedDate < fromDate) {
          return false
        }

        if (filters.updatedAtRange.to) {
          const toDate = new Date(filters.updatedAtRange.to)
          toDate.setHours(23, 59, 59, 999)
          if (updatedDate > toDate) {
            return false
          }
        }
      }

      // Filtro por tipos (multi-select)
      if (filters.types.length > 0 && !filters.types.includes(complaint.type)) {
        return false
      }

      // Filtro por estados (multi-select)
      if (filters.statuses.length > 0 && !filters.statuses.includes(complaint.status)) {
        return false
      }

      return true
    })
  }, [complaints, debouncedId, debouncedDriverTerm, filters.updatedAtRange, filters.types, filters.statuses])

  // Ordenar datos filtrados
  const sortedComplaints = useMemo(() => {
    const sorted = [...filteredComplaints].sort((a, b) => {
      let aVal: any = a[sort.key]
      let bVal: any = b[sort.key]

      // Convertir fechas para comparación
      if (sort.key === 'receivedAt' || sort.key === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredComplaints, sort])

  // Paginar datos
  const paginatedComplaints = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedComplaints.slice(startIndex, endIndex)
  }, [sortedComplaints, page, pageSize])

  const totalPages = Math.ceil(sortedComplaints.length / pageSize)

  // Handlers
  const handleSort = (key: SortKey) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setPage(1)
  }

  const getSortIcon = (key: SortKey) => {
    if (sort.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    return sort.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as 25 | 50 | 100)
    setPage(1)
  }

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  const handleExportCSV = (allData: boolean = false) => {
    const dataToExport = allData ? sortedComplaints : paginatedComplaints
    const headers = ["ID", "Driver", "Tipo", "Fecha de recepción", "Estado"]
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(item =>
        [
          item.id,
          `"${item.driverName}"`,
          item.type,
          formatDate(item.receivedAt),
          item.status
        ].join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `quejas_aclaraciones_${allData ? 'todos' : 'pagina'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportExcel = (allData: boolean = false) => {
    const dataToExport = allData ? sortedComplaints : paginatedComplaints
    const headers = ["ID", "Driver", "Tipo", "Fecha de recepción", "Estado"]
    const csvContent = [
      headers.join("\t"),
      ...dataToExport.map(item =>
        [
          item.id,
          item.driverName,
          item.type,
          formatDate(item.receivedAt),
          item.status
        ].join("\t")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `quejas_aclaraciones_${allData ? 'todos' : 'pagina'}_${new Date().toISOString().split('T')[0]}.xls`
    link.click()
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handlers de filtros
  const handleClearFilters = () => {
    setFilters({
      id: "",
      driverTerm: "",
      updatedAtRange: undefined,
      types: [],
      statuses: ["Nueva", "En proceso"] // Volver a default
    })
  }

  const handleToggleType = (type: ComplaintType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }

  const handleToggleStatus = (status: ComplaintStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }))
  }

  const handleRemoveFilter = (filterKey: keyof FilterState) => {
    switch (filterKey) {
      case 'id':
        setFilters(prev => ({ ...prev, id: "" }))
        break
      case 'driverTerm':
        setFilters(prev => ({ ...prev, driverTerm: "" }))
        break
      case 'updatedAtRange':
        setFilters(prev => ({ ...prev, updatedAtRange: undefined }))
        break
      case 'types':
        setFilters(prev => ({ ...prev, types: [] }))
        break
      case 'statuses':
        setFilters(prev => ({ ...prev, statuses: [] }))
        break
    }
  }

  // Contar filtros activos (excluyendo defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (debouncedId) count++
    if (debouncedDriverTerm) count++
    if (filters.updatedAtRange?.from) count++
    if (filters.types.length > 0) count++
    // Solo contar statuses si no es el default
    if (filters.statuses.length > 0 && 
        (filters.statuses.length !== 2 || 
         !filters.statuses.includes("Nueva") || 
         !filters.statuses.includes("En proceso"))) {
      count++
    }
    return count
  }, [debouncedId, debouncedDriverTerm, filters.updatedAtRange, filters.types, filters.statuses])

  // Estado vacío
  if (!loading && complaints.length === 0 && !showError) {
    return (
      <RoleGuard moduleKey={moduleKey}>
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay registros</h3>
              <p className="text-muted-foreground text-center">
                No se han recibido quejas o aclaraciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6">
        {/* Toast */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Error State */}
        {showError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar los registros. Intenta nuevamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla Principal */}
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quejas y Aclaraciones</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredComplaints.length} de {complaints.length} registros
                    {activeFiltersCount > 0 && ` • ${activeFiltersCount} filtro(s) activo(s)`}
                  </p>
                </div>
                <Select 
                  onValueChange={(value) => {
                    if (value === "csv-page") handleExportCSV(false);
                    else if (value === "csv-all") handleExportCSV(true);
                    else if (value === "excel-page") handleExportExcel(false);
                    else if (value === "excel-all") handleExportExcel(true);
                  }}
                  disabled={loading || filteredComplaints.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <Download className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Exportar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv-page">CSV (Página actual)</SelectItem>
                    <SelectItem value="csv-all">CSV (Todos filtrados)</SelectItem>
                    <SelectItem value="excel-page">Excel (Página actual)</SelectItem>
                    <SelectItem value="excel-all">Excel (Todos filtrados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barra de Filtros */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtros</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-xs"
                    >
                      <FilterX className="mr-2 h-3 w-3" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Filtro por ID */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">ID</label>
                    <Input
                      placeholder="Buscar por ID..."
                      value={filters.id}
                      onChange={(e) => setFilters(prev => ({ ...prev, id: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Filtro por Driver */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Driver (Nombre o RFC)</label>
                    <Input
                      placeholder="Buscar driver..."
                      value={filters.driverTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, driverTerm: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Filtro por fecha de actualización */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Fecha de actualización</label>
                    <DatePickerWithRange
                      date={filters.updatedAtRange}
                      onDateChange={(range) => setFilters(prev => ({ ...prev, updatedAtRange: range }))}
                      placeholder="Selecciona rango..."
                    />
                  </div>

                  {/* Botón para segunda fila en móvil */}
                  <div className="hidden xl:block" />
                </div>

                {/* Filtros multi-select: Tipo y Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro por Tipo */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Queja", "Aclaración", "Comentario"] as ComplaintType[]).map(type => (
                        <Badge
                          key={type}
                          variant={filters.types.includes(type) ? getTypeBadgeVariant(type) : "outline"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleToggleType(type)}
                        >
                          {type}
                          {filters.types.includes(type) && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Filtro por Estado */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Estado</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Nueva", "En proceso", "Resuelta"] as ComplaintStatus[]).map(status => (
                        <Badge
                          key={status}
                          variant={filters.statuses.includes(status) ? getStatusBadgeVariant(status) : "outline"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleToggleStatus(status)}
                        >
                          {status}
                          {filters.statuses.includes(status) && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chips de filtros activos */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {debouncedId && (
                      <Badge variant="secondary" className="gap-1">
                        ID: {debouncedId}
                        <button
                          onClick={() => handleRemoveFilter('id')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          aria-label="Remover filtro de ID"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {debouncedDriverTerm && (
                      <Badge variant="secondary" className="gap-1">
                        Driver: {debouncedDriverTerm}
                        <button
                          onClick={() => handleRemoveFilter('driverTerm')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          aria-label="Remover filtro de driver"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.updatedAtRange?.from && (
                      <Badge variant="secondary" className="gap-1">
                        Fecha: {filters.updatedAtRange.from.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        {filters.updatedAtRange.to && ` - ${filters.updatedAtRange.to.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}`}
                        <button
                          onClick={() => handleRemoveFilter('updatedAtRange')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          aria-label="Remover filtro de fecha"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.types.length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        Tipos: {filters.types.length}
                        <button
                          onClick={() => handleRemoveFilter('types')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          aria-label="Remover filtro de tipos"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.statuses.length > 0 && 
                     (filters.statuses.length !== 2 || 
                      !filters.statuses.includes("Nueva") || 
                      !filters.statuses.includes("En proceso")) && (
                      <Badge variant="secondary" className="gap-1">
                        Estados: {filters.statuses.length}
                        <button
                          onClick={() => handleRemoveFilter('statuses')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          aria-label="Remover filtro de estados"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Sin resultados después de filtrar */}
          {!loading && filteredComplaints.length === 0 && complaints.length > 0 && (
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay registros con los filtros aplicados</h3>
              <p className="text-muted-foreground text-center mb-4">
                Intenta ajustar o limpiar los filtros para ver más resultados.
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            </CardContent>
          )}

          {/* Tabla (solo si hay resultados) */}
          {(loading || filteredComplaints.length > 0) && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('id')}
                      >
                        ID
                        {getSortIcon('id')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('driverName')}
                      >
                        Driver
                        {getSortIcon('driverName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('type')}
                      >
                        Tipo
                        {getSortIcon('type')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('receivedAt')}
                      >
                        Fecha de recepción
                        {getSortIcon('receivedAt')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('updatedAt')}
                      >
                        Última actualización
                        {getSortIcon('updatedAt')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Estado
                        {getSortIcon('status')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Skeleton rows
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedComplaints.map((complaint) => (
                      <TableRow 
                        key={complaint.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setLoadingDetail(true)
                          router.push(`/complaints/${complaint.id}`)
                        }}
                      >
                        <TableCell className="font-medium">{complaint.id}</TableCell>
                        <TableCell>{complaint.driverName}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(complaint.type)}>
                            {complaint.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(complaint.receivedAt)}</TableCell>
                        <TableCell>{formatDate(complaint.updatedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(complaint.status)}>
                            {complaint.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {loading && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Cargando registros...
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Paginación */}
        {filteredComplaints.length > 0 && !loading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Registros por página:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange} disabled={loading}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages || loading}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Overlay de loading al navegar a detalle */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando detalle de la queja...</p>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
