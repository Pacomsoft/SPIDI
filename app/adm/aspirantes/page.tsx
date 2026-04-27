"use client"

import { RoleGuard } from "@/modules/adm/application/presentation/components/role-guard"
import { createCheckModuleAccessUseCase } from "@/modules/adm/infrastructure/dependency-injection"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ExternalLink,
  Car,
  FileText,
  X
} from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { DateRange } from "react-day-picker"

const checkModuleAccessUseCase = createCheckModuleAccessUseCase()
const moduleKey = "ASPIRANTES"

// Tipos
type EstadoAplicacion = "Pendiente" | "En Revisión" | "Propuesta enviada" | "Aprobado" | "Rechazado"
type EstadoDocumentacion = "Pendiente" | "Incompleto" | "Completo" | "Revisión"
type EstadoDocumento = "completo" | "pendiente" | "rechazado" | "revision"

interface Documento {
  nombre: string
  estado: EstadoDocumento
}

interface Aspirante {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  telefono: string
  email: string
  ubicacion: string
  fecha: Date
  estadoAplicacion: EstadoAplicacion
  estadoDocumentacion: EstadoDocumentacion
  documentos: Documento[]
  vehiculo?: {
    marca: string
    modelo: string
    año: number
    color: string
  }
  notas?: string
}

// Datos dummy (40 registros)
const ciudades = ["Monterrey", "Guadalupe", "San Pedro", "Apodaca", "Escobedo", "Santa Catarina"]
const nombresDocumentos = [
  "INE",
  "Comprobante Domicilio",
  "RFC",
  "Licencia Conducir",
  "NSS",
  "Acta Nacimiento"
]
const marcasVehiculos = ["Toyota", "Nissan", "Chevrolet", "Honda", "Mazda", "Ford"]
const modelosVehiculos = ["Sedan", "Hatchback", "SUV", "Pickup"]
const coloresVehiculos = ["Blanco", "Negro", "Plata", "Gris", "Rojo", "Azul"]
const notasEjemplo = [
  "Candidato prometedor, buena actitud",
  "Experiencia previa como repartidor",
  "Requiere seguimiento en documentación",
  "Pendiente verificación de referencias",
  "Cuenta con vehículo propio en buen estado",
  ""
]

// Función para generar documentos aleatorios
const generarDocumentos = (): Documento[] => {
  const estados: EstadoDocumento[] = ["completo", "pendiente", "rechazado", "revision"]
  return nombresDocumentos.map(nombre => ({
    nombre,
    estado: estados[Math.floor(Math.random() * estados.length)]
  }))
}
const aspirantesData = [
  { nombre: "Juan", paterno: "Pérez", materno: "García" },
  { nombre: "María", paterno: "García", materno: "López" },
  { nombre: "Carlos", paterno: "López", materno: "Martínez" },
  { nombre: "Ana", paterno: "Martínez", materno: "Rodríguez" },
  { nombre: "Luis", paterno: "Rodríguez", materno: "Hernández" },
  { nombre: "Carmen", paterno: "Hernández", materno: "González" },
  { nombre: "José", paterno: "González", materno: "Sánchez" },
  { nombre: "Laura", paterno: "Sánchez", materno: "Torres" },
  { nombre: "Miguel", paterno: "Torres", materno: "Ramírez" },
  { nombre: "Patricia", paterno: "Ramírez", materno: "Flores" },
  { nombre: "Francisco", paterno: "Flores", materno: "Cruz" },
  { nombre: "Isabel", paterno: "Cruz", materno: "Morales" },
  { nombre: "Antonio", paterno: "Morales", materno: "Jiménez" },
  { nombre: "Rosa", paterno: "Jiménez", materno: "Ruiz" },
  { nombre: "Manuel", paterno: "Ruiz", materno: "Mendoza" },
  { nombre: "Teresa", paterno: "Mendoza", materno: "Álvarez" },
  { nombre: "David", paterno: "Álvarez", materno: "Castro" },
  { nombre: "Gabriela", paterno: "Castro", materno: "Ortiz" },
  { nombre: "Roberto", paterno: "Ortiz", materno: "Vargas" },
  { nombre: "Elena", paterno: "Vargas", materno: "Medina" },
  { nombre: "Jorge", paterno: "Medina", materno: "Reyes" },
  { nombre: "Sofía", paterno: "Reyes", materno: "Gutiérrez" },
  { nombre: "Rafael", paterno: "Gutiérrez", materno: "Romero" },
  { nombre: "Lucía", paterno: "Romero", materno: "Díaz" },
  { nombre: "Pedro", paterno: "Díaz", materno: "Silva" },
  { nombre: "Mariana", paterno: "Silva", materno: "Muñoz" },
  { nombre: "Alberto", paterno: "Muñoz", materno: "Rojas" },
  { nombre: "Cristina", paterno: "Rojas", materno: "Herrera" },
  { nombre: "Sergio", paterno: "Herrera", materno: "Núñez" },
  { nombre: "Diana", paterno: "Núñez", materno: "Acosta" },
  { nombre: "Fernando", paterno: "Acosta", materno: "Vega" },
  { nombre: "Adriana", paterno: "Vega", materno: "Peña" },
  { nombre: "Ricardo", paterno: "Peña", materno: "Aguilar" },
  { nombre: "Mónica", paterno: "Aguilar", materno: "Domínguez" },
  { nombre: "Arturo", paterno: "Domínguez", materno: "León" },
  { nombre: "Verónica", paterno: "León", materno: "Campos" },
  { nombre: "Guillermo", paterno: "Campos", materno: "Ríos" },
  { nombre: "Beatriz", paterno: "Ríos", materno: "Paredes" },
  { nombre: "Eduardo", paterno: "Paredes", materno: "Cortés" },
  { nombre: "Sandra", paterno: "Cortés", materno: "Ramírez" }
]

const generarDatosDummy = (): Aspirante[] => {
  const estadosAplicacion: EstadoAplicacion[] = ["Pendiente", "En Revisión", "Propuesta enviada", "Aprobado", "Rechazado"]
  const estadosDoc: EstadoDocumentacion[] = ["Pendiente", "Incompleto", "Completo", "Revisión"]
  
  const aspirantesGenerados = aspirantesData.map((persona, index) => ({
    id: `ASP-${String(index + 1).padStart(4, '0')}`,
    nombre: persona.nombre,
    apellidoPaterno: persona.paterno,
    apellidoMaterno: persona.materno,
    telefono: `81${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`,
    email: `${persona.nombre.toLowerCase()}.${persona.paterno.toLowerCase()}@email.com`,
    ubicacion: ciudades[Math.floor(Math.random() * ciudades.length)],
    fecha: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    estadoAplicacion: estadosAplicacion[Math.floor(Math.random() * estadosAplicacion.length)],
    estadoDocumentacion: estadosDoc[Math.floor(Math.random() * estadosDoc.length)],
    documentos: generarDocumentos(),
    vehiculo: Math.random() > 0.3 ? {
      marca: marcasVehiculos[Math.floor(Math.random() * marcasVehiculos.length)],
      modelo: modelosVehiculos[Math.floor(Math.random() * modelosVehiculos.length)],
      año: 2015 + Math.floor(Math.random() * 10),
      color: coloresVehiculos[Math.floor(Math.random() * coloresVehiculos.length)]
    } : undefined,
    notas: notasEjemplo[Math.floor(Math.random() * notasEjemplo.length)]
  }))
  
  // Agregar aspirante de prueba con datos completos (ASP-9999)
  aspirantesGenerados.push({
    id: "ASP-9999",
    nombre: "Roberto",
    apellidoPaterno: "González",
    apellidoMaterno: "Salazar",
    telefono: "8187654321",
    email: "roberto.gonzalez@email.com",
    ubicacion: "Monterrey",
    fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
    estadoAplicacion: "En Revisión",
    estadoDocumentacion: "Completo",
    documentos: [
      { nombre: "INE", estado: "completo" },
      { nombre: "Comprobante Domicilio", estado: "completo" },
      { nombre: "RFC", estado: "completo" },
      { nombre: "Licencia Conducir", estado: "completo" },
      { nombre: "NSS", estado: "pendiente" },
      { nombre: "Acta Nacimiento", estado: "revision" }
    ],
    vehiculo: {
      marca: "Toyota",
      modelo: "Sedan",
      año: 2020,
      color: "Blanco"
    },
    notas: "Candidato con excelente perfil. Experiencia previa de 3 años como repartidor. Cuenta con vehículo en buen estado."
  })
  
  return aspirantesGenerados
}

const ASPIRANTES_DATA = generarDatosDummy()

export default function AspirantesPage() {
  const router = useRouter()
  
  // Estados
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoAplicacionFilter, setEstadoAplicacionFilter] = useState<string>("activos")
  const [estadoDocFilter, setEstadoDocFilter] = useState<string>("todos")
  const [ubicacionFilter, setUbicacionFilter] = useState<string>("todos")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortColumn, setSortColumn] = useState<keyof Aspirante | null>("fecha")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAspirante, setSelectedAspirante] = useState<Aspirante | null>(null)

  // Filtrado y ordenamiento
  const filteredAndSortedData = useMemo(() => {
    let result = [...ASPIRANTES_DATA]

    // Búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim()
      result = result.filter(item => {
        // Concatenar nombre completo para búsqueda
        const nombreCompleto = `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno}`.toLowerCase()
        
        return (
          nombreCompleto.includes(searchLower) ||
          item.telefono.includes(searchTerm) ||
          item.email.toLowerCase().includes(searchLower)
        )
      })
    }

    // Filtros
    if (estadoAplicacionFilter === "activos") {
      result = result.filter(item => 
        item.estadoAplicacion === "Pendiente" || 
        item.estadoAplicacion === "En Revisión" || 
        item.estadoAplicacion === "Propuesta enviada"
      )
    } else if (estadoAplicacionFilter !== "todos") {
      result = result.filter(item => item.estadoAplicacion === estadoAplicacionFilter)
    }
    if (estadoDocFilter !== "todos") {
      result = result.filter(item => item.estadoDocumentacion === estadoDocFilter)
    }
    if (ubicacionFilter !== "todos") {
      result = result.filter(item => item.ubicacion === ubicacionFilter)
    }
    if (dateRange?.from) {
      const desde = new Date(dateRange.from)
      desde.setHours(0, 0, 0, 0)
      result = result.filter(item => item.fecha >= desde)
    }
    if (dateRange?.to) {
      const hasta = new Date(dateRange.to)
      hasta.setHours(23, 59, 59, 999)
      result = result.filter(item => item.fecha <= hasta)
    }

    // Ordenamiento
    if (sortColumn) {
      result.sort((a, b) => {
        let compareA: any = a[sortColumn]
        let compareB: any = b[sortColumn]

        if (sortColumn === "fecha") {
          compareA = (a[sortColumn] as Date).getTime()
          compareB = (b[sortColumn] as Date).getTime()
        }

        if (compareA < compareB) return sortDirection === "asc" ? -1 : 1
        if (compareA > compareB) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [searchTerm, estadoAplicacionFilter, estadoDocFilter, ubicacionFilter, dateRange, sortColumn, sortDirection])

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Cambiar página cuando cambian filtros
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, estadoAplicacionFilter, estadoDocFilter, ubicacionFilter, dateRange, itemsPerPage])

  // Handlers
  const handleSort = (column: keyof Aspirante) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const exportToCSV = (allData: boolean = false) => {
    const dataToExport = allData ? filteredAndSortedData : paginatedData
    const headers = ["ID", "Nombre", "Teléfono", "Email", "Ubicación", "Fecha", "Estado Aplicación", "Estado Documentación"]
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(item =>
        [
          item.id,
          `"${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno}"`,
          item.telefono,
          item.email,
          item.ubicacion,
          item.fecha.toLocaleDateString(),
          item.estadoAplicacion,
          item.estadoDocumentacion
        ].join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `aspirantes_${allData ? 'todos' : 'pagina'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToExcel = (allData: boolean = false) => {
    const dataToExport = allData ? filteredAndSortedData : paginatedData
    const headers = ["ID", "Nombre", "Teléfono", "Email", "Ubicación", "Fecha", "Estado Aplicación", "Estado Documentación"]
    const csvContent = [
      headers.join("\t"),
      ...dataToExport.map(item =>
        [
          item.id,
          `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno}`,
          item.telefono,
          item.email,
          item.ubicacion,
          item.fecha.toLocaleDateString(),
          item.estadoAplicacion,
          item.estadoDocumentacion
        ].join("\t")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `aspirantes_${allData ? 'todos' : 'pagina'}_${new Date().toISOString().split('T')[0]}.xls`
    link.click()
  }

  const getEstadoAplicacionClasses = (estado: EstadoAplicacion): string => {
    switch (estado) {
      case "Aprobado": 
        return "badge-aprobado"
      case "Rechazado": 
        return "badge-rechazado"
      case "En Revisión": 
        return "badge-revision"
      case "Propuesta enviada": 
        return "badge-propuesta"
      default: 
        return "badge-pendiente"
    }
  }

  // Componente para visualizar documentos con dots
  const DocumentosVisualizacion = ({ documentos }: { documentos: Documento[] }) => {
    const completados = documentos.filter(d => d.estado === "completo").length
    const total = documentos.length

    const getColorDot = (estado: EstadoDocumento) => {
      switch (estado) {
        case "completo":
          return "dot-completo"
        case "pendiente":
          return "dot-pendiente"
        case "rechazado":
          return "dot-rechazado"
        case "revision":
          return "dot-revision"
      }
    }

    const getLabel = (estado: EstadoDocumento) => {
      switch (estado) {
        case "completo":
          return "Completo"
        case "pendiente":
          return "Pendiente"
        case "rechazado":
          return "Rechazado"
        case "revision":
          return "En revisión"
      }
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {documentos.map((doc, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${getColorDot(doc.estado)} cursor-help`}
              title={`${doc.nombre}: ${getLabel(doc.estado)}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {completados}/{total}
        </span>
      </div>
    )
  }

  const SortIcon = ({ column }: { column: keyof Aspirante }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <RoleGuard moduleKey={moduleKey} checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6">
        {/* Tabla Principal */}
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Listado de aspirantes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredAndSortedData.length} aspirantes {filteredAndSortedData.length !== ASPIRANTES_DATA.length && `(filtrados de ${ASPIRANTES_DATA.length})`}
                </p>
              </div>

              {/* Filtros y búsqueda */}
              <div className="space-y-4">
                {/* Primera fila: Búsqueda + Exportar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, teléfono o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  {/* Botón de exportación */}
                  <Select onValueChange={(value) => {
                    if (value === "csv-page") exportToCSV(false)
                    if (value === "csv-all") exportToCSV(true)
                    if (value === "excel-page") exportToExcel(false)
                    if (value === "excel-all") exportToExcel(true)
                  }}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Download className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Exportar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv-page">CSV (Página actual)</SelectItem>
                      <SelectItem value="csv-all">CSV (Todos)</SelectItem>
                      <SelectItem value="excel-page">Excel (Página actual)</SelectItem>
                      <SelectItem value="excel-all">Excel (Todos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Segunda fila: Tabs + Filtros */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Tabs de Estado */}
                  <div className="lg:flex-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <Tabs value={estadoAplicacionFilter} onValueChange={setEstadoAplicacionFilter}>
                      <TabsList className="h-9 w-max lg:w-auto inline-flex">
                        <TabsTrigger value="activos" className="text-xs whitespace-nowrap">
                          Activos
                        </TabsTrigger>
                        <TabsTrigger value="todos" className="text-xs whitespace-nowrap">
                          Todos
                        </TabsTrigger>
                        <TabsTrigger value="Pendiente" className="text-xs whitespace-nowrap">
                          Pendiente
                        </TabsTrigger>
                        <TabsTrigger value="En Revisión" className="text-xs whitespace-nowrap">
                          Revisión
                        </TabsTrigger>
                        <TabsTrigger value="Propuesta enviada" className="text-xs whitespace-nowrap">
                          Propuesta
                        </TabsTrigger>
                        <TabsTrigger value="Aprobado" className="text-xs whitespace-nowrap">
                          Aprobado
                        </TabsTrigger>
                        <TabsTrigger value="Rechazado" className="text-xs whitespace-nowrap">
                          Rechazado
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Filtros adicionales */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:w-auto">
                    {/* Filtro Estado Documentación */}
                    <Select value={estadoDocFilter} onValueChange={setEstadoDocFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Estado docs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Incompleto">Incompleto</SelectItem>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Revisión">Revisión</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Filtro Ubicación */}
                    <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las ubicaciones</SelectItem>
                        {ciudades.map(ciudad => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Filtro Rango de Fechas */}
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                      placeholder="Filtrar fecha"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Tabla */}
            <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Nombre</TableHead>
                    <TableHead className="whitespace-nowrap">Teléfono</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                      onClick={() => handleSort("ubicacion")}
                    >
                      <div className="flex items-center">
                        Ubicación
                        <SortIcon column="ubicacion" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                      onClick={() => handleSort("fecha")}
                    >
                      <div className="flex items-center">
                        Fecha
                        <SortIcon column="fecha" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                      onClick={() => handleSort("estadoAplicacion")}
                    >
                      <div className="flex items-center">
                        Estado Aplicación
                        <SortIcon column="estadoAplicacion" />
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Estado Documentación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No se encontraron aspirantes con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((aspirante) => (
                      <TableRow 
                        key={aspirante.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          setSelectedAspirante(aspirante)
                          setDrawerOpen(true)
                        }}
                      >
                        <TableCell className="font-medium">{aspirante.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="whitespace-nowrap">{aspirante.nombre} {aspirante.apellidoPaterno} {aspirante.apellidoMaterno}</span>
                            {aspirante.id === "ASP-9999" && (
                              <Badge variant="outline" className="text-xs badge-prueba whitespace-nowrap">
                                🧪 PRUEBA
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{aspirante.telefono}</TableCell>
                        <TableCell className="whitespace-nowrap">{aspirante.ubicacion}</TableCell>
                        <TableCell className="whitespace-nowrap">{aspirante.fecha.toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`whitespace-nowrap ${getEstadoAplicacionClasses(aspirante.estadoAplicacion)}`}>
                            {aspirante.estadoAplicacion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DocumentosVisualizacion documentos={aspirante.documentos} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 sm:px-0">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="text-xs sm:text-sm text-muted-foreground">Mostrar</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  de {filteredAndSortedData.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8"
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Overlay de loading al navegar a detalle */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando detalle del aspirante...</p>
            </div>
          </div>
        )}

        {/* Drawer de resumen rápido */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Resumen - {selectedAspirante?.id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetTitle>
              <SheetDescription>
                Vista rápida del aspirante
              </SheetDescription>
            </SheetHeader>

            {selectedAspirante && (
              <div className="mt-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">
                        {selectedAspirante.nombre} {selectedAspirante.apellidoPaterno} {selectedAspirante.apellidoMaterno}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{selectedAspirante.telefono}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-xs">{selectedAspirante.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span className="font-medium">{selectedAspirante.ubicacion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha registro:</span>
                      <span className="font-medium">{selectedAspirante.fecha.toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Estado</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className={`${getEstadoAplicacionClasses(selectedAspirante.estadoAplicacion)}`}>
                      {selectedAspirante.estadoAplicacion}
                    </Badge>
                    {selectedAspirante.id === "ASP-9999" && (
                      <Badge variant="outline" className="text-xs badge-prueba">
                        🧪 PRUEBA
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Vehículo */}
                {selectedAspirante.vehiculo && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marca:</span>
                        <span className="font-medium">{selectedAspirante.vehiculo.marca}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Modelo:</span>
                        <span className="font-medium">{selectedAspirante.vehiculo.modelo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Año:</span>
                        <span className="font-medium">{selectedAspirante.vehiculo.año}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color:</span>
                        <span className="font-medium">{selectedAspirante.vehiculo.color}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documentos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentación
                  </h3>
                  <div className="space-y-2">
                    {selectedAspirante.documentos.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{doc.nombre}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            doc.estado === "completo" ? "dot-completo" :
                            doc.estado === "pendiente" ? "dot-pendiente" :
                            doc.estado === "rechazado" ? "dot-rechazado" :
                            "dot-revision"
                          }`} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {doc.estado === "completo" ? "Completo" :
                             doc.estado === "pendiente" ? "Pendiente" :
                             doc.estado === "rechazado" ? "Rechazado" :
                             "En revisión"}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Progreso:</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAspirante.documentos.filter(d => d.estado === "completo").length}/{selectedAspirante.documentos.length} completos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedAspirante.notas && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notas</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedAspirante.notas}
                    </p>
                  </div>
                )}

                {/* Botón Ver Detalle Completo */}
                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setDrawerOpen(false)
                      setLoadingDetail(true)
                      router.push(`/adm/aspirantes/${selectedAspirante.id}`)
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver detalle completo
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </RoleGuard>
  )
}
