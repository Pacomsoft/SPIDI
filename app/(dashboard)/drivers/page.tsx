"use client"

import { RoleGuard } from "@/components/role-guard"
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
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Loader2
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"

const moduleKey = "DRIVERS"

// ==========================================
// FUNCIONES DE BÚSQUEDA AVANZADA
// ==========================================
// Implementa 6 patrones de búsqueda para mejorar la experiencia del usuario:
// 1. Coincidencia exacta (case-sensitive)
// 2. Coincidencia sin acentos ni puntuación (case-insensitive)
// 3. Prefijo - ILIKE 'term%'
// 4. Sufijo - ILIKE '%term'
// 5. Contiene - ILIKE '%term%'
// 6. Similitud aproximada >= 85% (fuzzy matching con Levenshtein)
// ==========================================

/**
 * Normaliza un texto removiendo acentos, puntuación y convirtiendo a minúsculas
 */
const normalizeText = (text: string): string => {
  return text
    .normalize("NFD") // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Remover marcas diacríticas
    .replace(/[^\w\s]/g, "") // Remover puntuación
    .toLowerCase()
    .trim()
}

/**
 * Calcula la similitud entre dos strings usando Jaro-Winkler
 * Retorna un valor entre 0 y 1, donde 1 es idéntico
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  // Implementación simplificada de Jaro-Winkler
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  // Calcular distancia de Levenshtein normalizada
  const maxLen = Math.max(s1.length, s2.length)
  const distance = levenshteinDistance(s1, s2)
  const similarity = 1 - distance / maxLen
  
  return similarity
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Evalúa si un texto coincide con un término de búsqueda usando múltiples patrones
 * Retorna true si encuentra coincidencia en cualquiera de los patrones
 */
const matchesSearchTerm = (text: string, searchTerm: string): boolean => {
  if (!text || !searchTerm) return false
  
  const trimmedSearch = searchTerm.trim()
  if (trimmedSearch === "") return true
  
  // 1. Coincidencia exacta (case sensitive)
  if (text.includes(trimmedSearch)) {
    return true
  }
  
  // 2. Coincidencia exacta (case insensitive, sin acentos ni puntuación)
  const normalizedText = normalizeText(text)
  const normalizedSearch = normalizeText(trimmedSearch)
  if (normalizedText.includes(normalizedSearch)) {
    return true
  }
  
  // 3. Prefijo (case insensitive)
  if (normalizedText.startsWith(normalizedSearch)) {
    return true
  }
  
  // 4. Sufijo (case insensitive)
  if (normalizedText.endsWith(normalizedSearch)) {
    return true
  }
  
  // 5. Término en cualquier parte (ya cubierto por paso 2)
  
  // 6. Similitud aproximada >= 85%
  const similarity = calculateSimilarity(normalizedText, normalizedSearch)
  if (similarity >= 0.85) {
    return true
  }
  
  // También evaluar similitud con palabras individuales del texto
  const words = normalizedText.split(/\s+/)
  for (const word of words) {
    if (word.length >= 3) { // Solo palabras significativas
      const wordSimilarity = calculateSimilarity(word, normalizedSearch)
      if (wordSimilarity >= 0.85) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Resalta el término de búsqueda dentro de un texto
 * Retorna JSX con el término resaltado en <mark>
 */
const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm || searchTerm.trim() === "" || !text) {
    return text
  }

  const trimmedSearch = searchTerm.trim()
  
  // Intentar coincidencia directa (case insensitive)
  try {
    // Escapar caracteres especiales de regex
    const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedSearch})`, 'gi')
    
    // Si encuentra coincidencia directa, usarla
    if (regex.test(text)) {
      const parts = text.split(regex)
      return (
        <>
          {parts.map((part, index) => {
            if (regex.test(part)) {
              // Reiniciar el regex después del test
              regex.lastIndex = 0
              return (
                <mark 
                  key={index} 
                  className="bg-yellow-200 dark:bg-yellow-700 font-semibold px-0.5 rounded"
                >
                  {part}
                </mark>
              )
            }
            return part
          })}
        </>
      )
    }
  } catch (e) {
    // Si hay error en regex, continuar con búsqueda normalizada
  }

  // Intentar coincidencia normalizada (sin acentos)
  const normalizedText = normalizeText(text)
  const normalizedSearch = normalizeText(trimmedSearch)
  
  const startIdx = normalizedText.indexOf(normalizedSearch)
  if (startIdx !== -1) {
    // Encontrar la porción correspondiente en el texto original
    const beforeMatch = text.substring(0, startIdx)
    const match = text.substring(startIdx, startIdx + normalizedSearch.length)
    const afterMatch = text.substring(startIdx + normalizedSearch.length)
    
    return (
      <>
        {beforeMatch}
        <mark className="bg-yellow-200 dark:bg-yellow-700 font-semibold px-0.5 rounded">
          {match}
        </mark>
        {afterMatch}
      </>
    )
  }

  // Si no encontró coincidencia, retornar texto original
  return text
}

// Tipos
type EstadoDriver = "Habilitado" | "Deshabilitado" | "Suspendido"

interface Driver {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  curp: string
  email: string
  telefono: string
  estadoPais: string
  estadoDriver: EstadoDriver
  tiendaUltimoPedido: string
  fechaUltimoPedido: Date
}

type SortKey = keyof Driver | "nombreCompleto"
type SortDirection = "asc" | "desc" | null

// Datos dummy
const estados = ["Nuevo León", "Tamaulipas", "Coahuila", "San Luis Potosí", "Durango"]
const tiendas = ["HEB Cumbres", "HEB Lincoln", "Mi Tienda San Nicolás", "HEB Valle", "HEB Cumbres Élite", "Mi Tienda Guadalupe"]

const nombresDrivers = [
  { nombre: "Roberto", paterno: "Martínez", materno: "Silva" },
  { nombre: "Andrea", paterno: "López", materno: "García" },
  { nombre: "Fernando", paterno: "González", materno: "Rodríguez" },
  { nombre: "Carolina", paterno: "Hernández", materno: "Torres" },
  { nombre: "Diego", paterno: "Ramírez", materno: "Flores" },
  { nombre: "Valeria", paterno: "Sánchez", materno: "Morales" },
  { nombre: "Alejandro", paterno: "Cruz", materno: "Jiménez" },
  { nombre: "Daniela", paterno: "Moreno", materno: "Ruiz" },
  { nombre: "Gustavo", paterno: "Mendoza", materno: "Castro" },
  { nombre: "Natalia", paterno: "Álvarez", materno: "Ortiz" },
  { nombre: "Ricardo", paterno: "Vargas", materno: "Reyes" },
  { nombre: "Paola", paterno: "Medina", materno: "Gutiérrez" },
  { nombre: "Héctor", paterno: "Romero", materno: "Díaz" },
  { nombre: "Silvia", paterno: "Silva", materno: "Muñoz" },
  { nombre: "Javier", paterno: "Rojas", materno: "Herrera" },
  { nombre: "Claudia", paterno: "Núñez", materno: "Acosta" },
  { nombre: "Martín", paterno: "Vega", materno: "Domínguez" },
  { nombre: "Patricia", paterno: "Peña", materno: "León" },
  { nombre: "Omar", paterno: "Aguilar", materno: "Campos" },
  { nombre: "Liliana", paterno: "Ríos", materno: "Paredes" },
  { nombre: "Samuel", paterno: "Cortés", materno: "Ramos" },
  { nombre: "Mónica", paterno: "Fuentes", materno: "Vázquez" },
  { nombre: "Rodrigo", paterno: "Navarro", materno: "Delgado" },
  { nombre: "Adriana", paterno: "Castillo", materno: "Salazar" },
  { nombre: "Emilio", paterno: "Guerrero", materno: "Maldonado" },
  { nombre: "Gabriela", paterno: "Ortega", materno: "Estrada" },
  { nombre: "Hugo", paterno: "Soto", materno: "Cabrera" },
  { nombre: "Lorena", paterno: "Méndez", materno: "Lara" },
  { nombre: "Pablo", paterno: "Ibarra", materno: "Sandoval" },
  { nombre: "Veronica", paterno: "Gallegos", materno: "Cervantes" },
  { nombre: "Raúl", paterno: "Valdez", materno: "Pacheco" },
  { nombre: "Karla", paterno: "Zamora", materno: "Miranda" },
  { nombre: "Sergio", paterno: "Bustos", materno: "Sosa" },
  { nombre: "Alejandra", paterno: "Robles", materno: "Ávila" },
  { nombre: "Armando", paterno: "Ponce", materno: "Carrillo" },
  { nombre: "Lucía", paterno: "Escobar", materno: "Duarte" },
  { nombre: "Ignacio", paterno: "Quintero", materno: "Padilla" },
  { nombre: "Beatriz", paterno: "Montes", materno: "Velázquez" },
  { nombre: "Víctor", paterno: "Espinosa", materno: "Figueroa" },
  { nombre: "Mariana", paterno: "Molina", materno: "Nieto" },
  { nombre: "César", paterno: "Arias", materno: "Valencia" },
  { nombre: "Sandra", paterno: "Cárdenas", materno: "Santana" },
  { nombre: "Enrique", paterno: "Contreras", materno: "Barrera" },
  { nombre: "Rocío", paterno: "Benitez", materno: "Aguirre" },
  { nombre: "Mauricio", paterno: "Luna", materno: "Montoya" },
  { nombre: "Paulina", paterno: "Cortez", materno: "Salas" },
  { nombre: "Leonardo", paterno: "Marín", materno: "Villa" },
  { nombre: "Fernanda", paterno: "Cabrera", materno: "Rangel" },
  { nombre: "Alberto", paterno: "Leyva", materno: "Mejía" },
  { nombre: "Victoria", paterno: "Miranda", materno: "Trejo" }
]

// Componente Label
const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {children}
  </label>
)

export default function DriversPage() {
  const router = useRouter()
  
  // Generar datos mock dentro del componente (evita hydration errors)
  const DRIVERS_DATA = useMemo(() => {
    return nombresDrivers.map((d, idx) => {
      const estadosDriver: EstadoDriver[] = ["Habilitado", "Deshabilitado", "Suspendido"]
      const randomEstadoDriver = idx < 35 ? "Habilitado" : estadosDriver[idx % 3]
      
      // Usar idx para generar valores determinísticos
      const telefonoSeed = (idx * 123456789) % 90000000
      const diaSeed = (idx * 7) % 20 + 1
      
      return {
        id: `DRV-${String(idx + 1).padStart(4, "0")}`,
        nombre: d.nombre,
        apellidoPaterno: d.paterno,
        apellidoMaterno: d.materno,
        curp: `${d.paterno.substring(0, 2).toUpperCase()}${d.materno.substring(0, 1).toUpperCase()}${d.nombre.substring(0, 1).toUpperCase()}${(80 + idx).toString().substring(1)}${(idx % 12 + 1).toString().padStart(2, "0")}${(idx % 28 + 1).toString().padStart(2, "0")}H${["NL", "TS", "CO", "SP", "DG"][idx % 5]}XXX0${(idx % 10)}`,
        email: `${d.nombre.toLowerCase()}.${d.paterno.toLowerCase()}@email.com`,
        telefono: `81${String(10000000 + telefonoSeed).substring(0, 8)}`,
        estadoPais: estados[idx % estados.length],
        estadoDriver: randomEstadoDriver,
        tiendaUltimoPedido: tiendas[idx % tiendas.length],
        fechaUltimoPedido: new Date(2026, 1, diaSeed)
      }
    })
  }, [])
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<EstadoDriver[]>(["Habilitado"])
  const [selectedEstadoPais, setSelectedEstadoPais] = useState<string>("all")
  const [selectedTienda, setSelectedTienda] = useState<string>("all")
  
  // Estados de ordenamiento
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Estados de historial de búsqueda
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  
  // Cargar historial de búsquedas desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('driversSearchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Error loading search history:', e)
      }
    }
  }, [])
  
  // Guardar búsqueda en historial cuando cambia searchTerm (después de 1 segundo)
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        setSearchHistory(prev => {
          const trimmed = searchTerm.trim()
          // Evitar duplicados y mantener solo las últimas 5
          const filtered = prev.filter(item => item !== trimmed)
          const newHistory = [trimmed, ...filtered].slice(0, 5)
          
          // Guardar en localStorage
          localStorage.setItem('driversSearchHistory', JSON.stringify(newHistory))
          return newHistory
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])
  
  // Simular loading cuando cambian filtros o paginación
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedStatus, selectedEstadoPais, selectedTienda, sortKey, sortDirection, currentPage, pageSize])
  
  // Aplicar filtros
  const filteredDrivers = useMemo(() => {
    return DRIVERS_DATA.filter(driver => {
      // Búsqueda avanzada por nombre completo, CURP, email o teléfono
      if (searchTerm && searchTerm.trim() !== "") {
        const fullName = `${driver.nombre} ${driver.apellidoPaterno} ${driver.apellidoMaterno}`
        
        // Evaluar coincidencia en cualquiera de los campos usando búsqueda avanzada
        const matchesName = matchesSearchTerm(fullName, searchTerm)
        const matchesCurp = matchesSearchTerm(driver.curp, searchTerm)
        const matchesEmail = matchesSearchTerm(driver.email, searchTerm)
        const matchesPhone = matchesSearchTerm(driver.telefono, searchTerm)
        
        // Si no coincide en ningún campo, filtrar este driver
        if (!matchesName && !matchesCurp && !matchesEmail && !matchesPhone) {
          return false
        }
      }
      
      // Filtro de estado driver (multi-select)
      if (selectedStatus.length > 0 && !selectedStatus.includes(driver.estadoDriver)) {
        return false
      }
      
      // Filtro de estado país
      if (selectedEstadoPais && selectedEstadoPais !== "all" && driver.estadoPais !== selectedEstadoPais) {
        return false
      }
      
      // Filtro de tienda
      if (selectedTienda && selectedTienda !== "all" && driver.tiendaUltimoPedido !== selectedTienda) {
        return false
      }
      
      return true
    })
  }, [DRIVERS_DATA, searchTerm, selectedStatus, selectedEstadoPais, selectedTienda])
  
  // Aplicar ordenamiento
  const sortedDrivers = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredDrivers
    
    return [...filteredDrivers].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      if (sortKey === "nombreCompleto") {
        aValue = `${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno}`
        bValue = `${b.nombre} ${b.apellidoPaterno} ${b.apellidoMaterno}`
      } else if (sortKey === "fechaUltimoPedido") {
        aValue = a[sortKey].getTime()
        bValue = b[sortKey].getTime()
      } else {
        aValue = a[sortKey]
        bValue = b[sortKey]
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredDrivers, sortKey, sortDirection])
  
  // Calcular paginación
  const totalPages = Math.ceil(sortedDrivers.length / pageSize)
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedDrivers.slice(startIndex, startIndex + pageSize)
  }, [sortedDrivers, currentPage, pageSize])
  
  // Handlers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Alternar: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }
  
  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedStatus(["Habilitado"])
    setSelectedEstadoPais("all")
    setSelectedTienda("all")
    setCurrentPage(1)
  }
  
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }
  
  const exportToCSV = (allData: boolean = false) => {
    const dataToExport = allData ? sortedDrivers : paginatedDrivers
    const headers = ["ID", "Nombre Completo", "CURP", "Email", "Teléfono", "Estado País", "Estado Driver", "Tienda Último Pedido", "Fecha Último Pedido"]
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(d =>
        [
          d.id,
          `"${d.nombre} ${d.apellidoPaterno} ${d.apellidoMaterno}"`,
          d.curp,
          d.email,
          d.telefono,
          d.estadoPais,
          d.estadoDriver,
          d.tiendaUltimoPedido,
          d.fechaUltimoPedido.toLocaleDateString("es-MX")
        ].join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `drivers_${new Date().getTime()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportToExcel = (allData: boolean = false) => {
    // Por ahora usa el mismo formato CSV
    exportToCSV(allData)
  }
  
  const toggleStatus = (status: EstadoDriver) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }
  
  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 ml-1" />
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4 ml-1" />
    return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
  }
  
  const getEstadoDriverBadge = (estado: EstadoDriver) => {
    switch (estado) {
      case "Habilitado":
        return <Badge variant="default">{estado}</Badge>
      case "Suspendido":
        return <Badge variant="secondary">{estado}</Badge>
      case "Deshabilitado":
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6">
        {/* Card principal */}
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Listado de Drivers</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {sortedDrivers.length} drivers {sortedDrivers.length !== DRIVERS_DATA.length && `(filtrados de ${DRIVERS_DATA.length})`}
                </p>
              </div>

              {/* Filtros y búsqueda */}
              <div className="space-y-4">
                {/* Primera fila: Búsqueda + Limpiar filtros + Exportar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Buscar por nombre, CURP, correo o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => {
                        setInputFocused(true)
                        setShowSuggestions(true)
                      }}
                      onBlur={() => {
                        // Delay para permitir click en sugerencias
                        setTimeout(() => {
                          setInputFocused(false)
                          setShowSuggestions(false)
                        }, 200)
                      }}
                      className="pl-8"
                    />
                    
                    {/* Sugerencias de búsquedas recientes */}
                    {showSuggestions && inputFocused && searchHistory.length > 0 && !searchTerm && (
                      <div className="absolute top-full mt-1 w-full bg-background border border-input rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="p-2 text-xs text-muted-foreground font-semibold border-b flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Búsquedas recientes
                        </div>
                        {searchHistory.map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchTerm(term)
                              setShowSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                          >
                            <Search className="h-3 w-3 text-muted-foreground" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
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

                {/* Segunda fila: Filtros específicos */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Multi-select Estado Driver */}
                  <div className="space-y-2">
                    <Label>Estado del driver</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["Habilitado", "Deshabilitado", "Suspendido"] as EstadoDriver[]).map(status => (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            selectedStatus.includes(status)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-input"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Estado País */}
                  <div className="space-y-2">
                    <Label htmlFor="estado-pais">Estado donde opera</Label>
                    <Select value={selectedEstadoPais} onValueChange={setSelectedEstadoPais}>
                      <SelectTrigger id="estado-pais">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {estados.map(estado => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Tienda */}
                  <div className="space-y-2">
                    <Label htmlFor="tienda">Tienda último pedido</Label>
                    <Select value={selectedTienda} onValueChange={setSelectedTienda}>
                      <SelectTrigger id="tienda">
                        <SelectValue placeholder="Todas las tiendas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las tiendas</SelectItem>
                        {tiendas.map(tienda => (
                          <SelectItem key={tienda} value={tienda}>
                            {tienda}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Tabla o estados de loading/empty */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No se encontraron drivers con los filtros seleccionados
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("nombreCompleto")}
                        >
                          <div className="flex items-center">
                            Nombre Completo
                            {getSortIcon("nombreCompleto")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("curp")}
                        >
                          <div className="flex items-center">
                            CURP
                            {getSortIcon("curp")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center">
                            Correo Electrónico
                            {getSortIcon("email")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("telefono")}
                        >
                          <div className="flex items-center">
                            Teléfono
                            {getSortIcon("telefono")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("estadoPais")}
                        >
                          <div className="flex items-center">
                            Estado
                            {getSortIcon("estadoPais")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("estadoDriver")}
                        >
                          <div className="flex items-center">
                            Estado Driver
                            {getSortIcon("estadoDriver")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("tiendaUltimoPedido")}
                        >
                          <div className="flex items-center">
                            Tienda
                            {getSortIcon("tiendaUltimoPedido")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("fechaUltimoPedido")}
                        >
                          <div className="flex items-center">
                            Fecha Último Pedido
                            {getSortIcon("fechaUltimoPedido")}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDrivers.map((driver) => {
                        const fullName = `${driver.nombre} ${driver.apellidoPaterno} ${driver.apellidoMaterno}`
                        return (
                        <TableRow 
                          key={driver.id}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setLoadingDetail(true)
                            router.push(`/drivers/${driver.id}`)
                          }}
                        >
                          <TableCell className="font-medium">
                            {highlightText(fullName, searchTerm)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {highlightText(driver.curp, searchTerm)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {highlightText(driver.email, searchTerm)}
                          </TableCell>
                          <TableCell>
                            {highlightText(driver.telefono, searchTerm)}
                          </TableCell>
                          <TableCell>{driver.estadoPais}</TableCell>
                          <TableCell>{getEstadoDriverBadge(driver.estadoDriver)}</TableCell>
                          <TableCell>{driver.tiendaUltimoPedido}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {driver.fechaUltimoPedido.toLocaleDateString("es-MX")}
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mostrar:</span>
                      <Select value={pageSize.toString()} onValueChange={(v) => handlePageSizeChange(Number(v))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} · Total: {sortedDrivers.length} drivers
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Overlay de loading al navegar a detalle */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando detalle del driver...</p>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
