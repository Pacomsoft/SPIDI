"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { RoleGuard } from "@/components/role-guard"
import { authProvider } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  Upload,
  MoreVertical,
  AlertTriangle,
  Info,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"

const moduleKey = "DRIVERS"

// Componentes UI simples
const Label = ({ htmlFor, children, className = "" }: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
)

const Textarea = ({ 
  placeholder, 
  value, 
  onChange, 
  rows = 3,
  className = "",
  disabled = false,
  maxLength
}: { 
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  className?: string
  disabled?: boolean
  maxLength?: number
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    disabled={disabled}
    maxLength={maxLength}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
)

// Wrapper para validar roles específicos
const RoleSpecificGuard = ({ 
  children, 
  requiredRoles 
}: { 
  children: React.ReactNode
  requiredRoles: string[]
}) => {
  const session = authProvider.getSession()
  if (!session || !requiredRoles.includes(session.role)) {
    return null
  }
  return <>{children}</>
}

// Tipos
type EstadoDriver = "Habilitado" | "Deshabilitado" | "Suspendido"
type EstadoIncapacidad = "Sin incapacidad" | "Con incapacidad"
type EstadoDocumento = "Pendiente" | "No legible" | "Prevalidado" | "Validado"

interface DriverData {
  id: string
  // Datos básicos (RN01 + RN09)
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  telefono: string
  email: string
  ciudad: string
  estado: string
  
  // Datos completos
  genero?: string
  fechaNacimiento?: string
  nacionalidad?: string
  rfc?: string
  curp?: string
  nss?: string
  fotografiaUrl?: string
  
  // Domicilio Personal
  calle?: string
  numeroExterior?: string
  numeroInterior?: string
  colonia?: string
  codigoPostal?: string
  
  // Domicilio Fiscal (solo lectura, escaneado del CSF)
  calleFiscal?: string
  numeroExteriorFiscal?: string
  numeroInteriorFiscal?: string
  coloniaFiscal?: string
  ciudadFiscal?: string
  estadoFiscal?: string
  codigoPostalFiscal?: string
  
  regimenFiscal?: string
  banco?: string
  clabe?: string
  
  // Vehículo
  vehiculoMarca: string
  vehiculoModelo: string
  vehiculoAnio: string
  vehiculoPlacas: string
  vehiculoColor: string
  
  // Específico de drivers
  estadoDriver: EstadoDriver
  incapacidad: EstadoIncapacidad
  tiendaUltimoPedido: string
  fechaUltimoCheckIn: Date
  
  // Beneficiarios
  beneficiarios?: Array<{
    nombre: string
    telefono: string
    porcentaje: number
  }>
}

interface Documento {
  tipo: string
  label: string
  fechaVigencia?: string
  estatus: EstadoDocumento
  archivoUrl?: string
  isExpired?: boolean
}

interface Order {
  orderId: string
  storeName: string
  deliveryDate: string
  deliverySlot: string
}

type OrderSortKey = 'orderId' | 'storeName' | 'deliveryDate' | 'deliverySlot'

interface PaymentWeek {
  year: number
  week: number
  weekStart: string
  weekEnd: string
  deliveredOrdersCount: number
  ordersAmount: number
  bonusesCount: number
  bonusesAmount: number
  adjustmentAmount: number
  totalAmount: number
  hasReceipt: boolean
  receiptUrl?: string
}

type PaymentSortKey = 'week' | 'deliveredOrdersCount' | 'ordersAmount' | 'bonusesCount' | 'bonusesAmount' | 'adjustmentAmount' | 'totalAmount'

const DOCUMENTOS_REQUERIDOS = [
  { tipo: "nss", label: "NSS" },
  { tipo: "licencia", label: "Licencia" },
  { tipo: "seguroAuto", label: "Seguro de Auto" },
  { tipo: "ine", label: "INE" },
  { tipo: "csf", label: "CSF (Constancia de Situación Fiscal)" },
  { tipo: "cuentaBancaria", label: "Carátula bancaria con CLABE" },
  { tipo: "contrato", label: "Contrato" },
]

const NOTES_MAX_LENGTH = 2000

// Mock data - en producción vendría de API
const generarDriverMock = (id: string): DriverData => ({
  id,
  nombre: "Roberto",
  apellidoPaterno: "Martínez",
  apellidoMaterno: "Silva",
  telefono: "8112345678",
  email: "roberto.martinez@email.com",
  ciudad: "Monterrey",
  estado: "Nuevo León",
  genero: "Masculino",
  fechaNacimiento: "1988-03-22",
  nacionalidad: "Mexicana",
  rfc: "MASR880322XXX",
  curp: "MASR880322HNLRBT01",
  nss: "12345678901",
  fotografiaUrl: "",
  
  // Domicilio Personal
  calle: "Avenida Constitución",
  numeroExterior: "456",
  numeroInterior: "3A",
  colonia: "Centro",
  codigoPostal: "64000",
  
  // Domicilio Fiscal
  calleFiscal: "Calle Hidalgo",
  numeroExteriorFiscal: "789",
  numeroInteriorFiscal: "",
  coloniaFiscal: "Centro",
  ciudadFiscal: "Monterrey",
  estadoFiscal: "Nuevo León",
  codigoPostalFiscal: "64000",
  
  regimenFiscal: "Persona Física con Actividad Empresarial",
  banco: "BBVA",
  clabe: "012180001234567890",
  vehiculoMarca: "Toyota",
  vehiculoModelo: "Corolla",
  vehiculoAnio: "2021",
  vehiculoPlacas: "XYZ9876",
  vehiculoColor: "Gris",
  estadoDriver: "Habilitado",
  incapacidad: "Sin incapacidad",
  tiendaUltimoPedido: "HEB Cumbres",
  fechaUltimoCheckIn: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
  beneficiarios: [
    { nombre: "María Martínez García", telefono: "8199887766", porcentaje: 60 },
    { nombre: "Carlos Martínez García", telefono: "8188776655", porcentaje: 40 }
  ]
})

// Generar pedidos dummy (50 pedidos para simular paginación)
const generarPedidosMock = (driverId: string): Order[] => {
  const tiendas = [
    "HEB Cumbres",
    "HEB Lincoln",
    "Mi Tienda San Nicolás",
    "HEB Valle",
    "HEB Cumbres Élite",
    "Mi Tienda Guadalupe"
  ]
  
  const slots = [
    "08:00–10:00",
    "10:00–12:00",
    "12:00–14:00",
    "14:00–16:00",
    "16:00–18:00",
    "18:00–20:00"
  ]
  
  const pedidos: Order[] = []
  const today = new Date()
  
  for (let i = 0; i < 50; i++) {
    const diasAtras = Math.floor(i / 3) // 3 pedidos por día aproximadamente
    const fecha = new Date(today)
    fecha.setDate(fecha.getDate() - diasAtras)
    
    pedidos.push({
      orderId: `ORD-${String(10000 + i).padStart(5, '0')}`,
      storeName: tiendas[i % tiendas.length],
      deliveryDate: fecha.toISOString().split('T')[0],
      deliverySlot: slots[i % slots.length]
    })
  }
  
  // Ordenar por fecha más reciente primero (default)
  return pedidos.sort((a, b) => {
    const dateCompare = b.deliveryDate.localeCompare(a.deliveryDate)
    if (dateCompare !== 0) return dateCompare
    return a.deliverySlot.localeCompare(b.deliverySlot)
  })
}

// Generar pagos semanales dummy (26 semanas ~ 6 meses)
const generarPagosMock = (driverId: string): PaymentWeek[] => {
  const pagos: PaymentWeek[] = []
  const today = new Date()
  
  // Función auxiliar para obtener el lunes de una semana
  const getMonday = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  // Función auxiliar para obtener número de semana ISO
  const getWeekNumber = (d: Date): number => {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
    const week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
  }

  // Generar 26 semanas hacia atrás
  for (let i = 0; i < 26; i++) {
    const weekDate = new Date(today)
    weekDate.setDate(weekDate.getDate() - (i * 7))
    
    const monday = getMonday(weekDate)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    
    const weekNumber = getWeekNumber(monday)
    const year = monday.getFullYear()
    
    // Generar datos variables
    const deliveredOrdersCount = Math.floor(Math.random() * 30) + 15 // 15-45 pedidos por semana
    const ordersAmount = deliveredOrdersCount * (Math.random() * 30 + 70) // $70-$100 por pedido
    const bonusesCount = Math.floor(Math.random() * 3) // 0-2 bonos
    const bonusesAmount = bonusesCount * (Math.random() * 200 + 300) // $300-$500 por bono
    const adjustmentAmount = Math.random() > 0.7 ? (Math.random() * 200 - 100) : 0 // Ajuste ocasional
    const totalAmount = ordersAmount + bonusesAmount + adjustmentAmount
    
    // 80% tienen recibo
    const hasReceipt = Math.random() > 0.2
    
    pagos.push({
      year,
      week: weekNumber,
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0],
      deliveredOrdersCount,
      ordersAmount: Math.round(ordersAmount * 100) / 100,
      bonusesCount,
      bonusesAmount: Math.round(bonusesAmount * 100) / 100,
      adjustmentAmount: Math.round(adjustmentAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      hasReceipt,
      receiptUrl: hasReceipt ? `/dummy/receipt-${year}-W${weekNumber}.pdf` : undefined
    })
  }
  
  // Ordenar por fecha más reciente primero
  return pagos.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.week - a.week
  })
}

const getBadgeVariant = (estado: EstadoDriver): "default" | "destructive" | "secondary" | "outline" => {
  switch (estado) {
    case "Habilitado":
      return "default" // Verde
    case "Deshabilitado":
      return "secondary" // Gris
    case "Suspendido":
      return "outline" // Ámbar/Amarillo (outline con clase personalizada)
    default:
      return "outline"
  }
}

const getDocumentStatusIcon = (estatus: EstadoDocumento) => {
  switch (estatus) {
    case "Validado":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "Prevalidado":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "No legible":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "Pendiente":
      return <XCircle className="h-4 w-4 text-gray-400" />
  }
}

const getDocumentStatusBadge = (estatus: EstadoDocumento) => {
  switch (estatus) {
    case "Validado":
      return <Badge variant="secondary" className="text-xs">{estatus}</Badge>
    case "Prevalidado":
      return <Badge variant="secondary" className="text-xs">{estatus}</Badge>
    case "No legible":
      return <Badge variant="destructive" className="text-xs">{estatus}</Badge>
    case "Pendiente":
      return <Badge variant="destructive" className="text-xs">{estatus}</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{estatus}</Badge>
  }
}

// Verificar si un documento está próximo a vencer (30 días o menos)
const isExpiringSoon = (fechaVigencia?: string): boolean => {
  if (!fechaVigencia) return false
  const today = new Date()
  const vigenciaDate = new Date(fechaVigencia)
  const diffTime = vigenciaDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
}

export default function DriverDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Estados
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [initialSnapshot, setInitialSnapshot] = useState<DriverData | null>(null)
  const [documentos, setDocumentos] = useState<Record<string, Documento>>({})
  const [notasInternas, setNotasInternas] = useState("")
  const [initialNotas, setInitialNotas] = useState("")
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<"deshabilitar" | "reactivar" | "suspender" | null>(null)
  
  // Estados para modal de carga de documentos
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDocType, setUploadDocType] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  // Estados para modal de pedidos
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [orderQuery, setOrderQuery] = useState("")
  const [orderSort, setOrderSort] = useState<{ key: OrderSortKey; direction: 'asc' | 'desc' }>({
    key: 'deliveryDate',
    direction: 'asc'
  })
  const [orderPage, setOrderPage] = useState(1)
  const [orderPageSize, setOrderPageSize] = useState(10)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // Estados para modal de pagos
  const [allPayments, setAllPayments] = useState<PaymentWeek[]>([])
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [paymentFilterYear, setPaymentFilterYear] = useState<number | null>(null)
  const [paymentFilterWeek, setPaymentFilterWeek] = useState<number | null>(null)
  const [paymentSort, setPaymentSort] = useState<{ key: PaymentSortKey; direction: 'asc' | 'desc' }>({
    key: 'week',
    direction: 'desc'
  })
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentPageSize] = useState(10)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentWeek | null>(null)
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = () => {
      const data = generarDriverMock(id)
      setDriver(data)
      setInitialSnapshot(JSON.parse(JSON.stringify(data)))

      // Cargar documentos desde localStorage o inicializar con ejemplos
      const savedDocs = localStorage.getItem(`driver_docs_${id}`)
      if (savedDocs) {
        setDocumentos(JSON.parse(savedDocs))
      } else {
        // Inicializar con ejemplos de diferentes estados
        const today = new Date()
        const futureDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
        const expiredDate = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())
        const expiringSoonDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15) // Vence en 15 días
        
        const initialDocs: Record<string, Documento> = {
          nss: {
            tipo: "nss",
            label: "NSS",
            estatus: "Validado",
            fechaVigencia: futureDate.toISOString().split('T')[0],
            isExpired: false
          },
          licencia: {
            tipo: "licencia",
            label: "Licencia",
            estatus: "Validado",
            fechaVigencia: expiredDate.toISOString().split('T')[0],
            isExpired: true
          },
          seguroAuto: {
            tipo: "seguroAuto",
            label: "Seguro de Auto",
            estatus: "Prevalidado",
            fechaVigencia: expiringSoonDate.toISOString().split('T')[0], // Por vencer
            isExpired: false
          },
          ine: {
            tipo: "ine",
            label: "INE",
            estatus: "Validado",
            fechaVigencia: futureDate.toISOString().split('T')[0],
            isExpired: false
          },
          csf: {
            tipo: "csf",
            label: "CSF (Constancia de Situación Fiscal)",
            estatus: "Validado",
            fechaVigencia: expiringSoonDate.toISOString().split('T')[0], // Por vencer
            isExpired: false
          },
          cuentaBancaria: {
            tipo: "cuentaBancaria",
            label: "Carátula bancaria con CLABE",
            estatus: "Validado",
            isExpired: false
          },
          contrato: {
            tipo: "contrato",
            label: "Contrato",
            estatus: "Validado",
            isExpired: false
          }
        }
        setDocumentos(initialDocs)
      }

      // Cargar notas internas
      const savedNotas = localStorage.getItem(`driver_notas_${id}`) || ""
      setNotasInternas(savedNotas)
      setInitialNotas(savedNotas)
    }

    loadData()
  }, [id])

  // Cargar pedidos
  useEffect(() => {
    const orders = generarPedidosMock(id)
    setAllOrders(orders)
  }, [id])

  // Cargar pagos
  useEffect(() => {
    const payments = generarPagosMock(id)
    setAllPayments(payments)
  }, [id])

  // Verificar si el driver está en modo solo lectura
  const isReadOnly = driver?.estadoDriver !== "Habilitado"

  // Detectar cambios
  const hasChanges = useMemo(() => {
    if (!driver || !initialSnapshot) return false
    const changed = JSON.stringify(driver) !== JSON.stringify(initialSnapshot)
    const notasChanged = notasInternas !== initialNotas
    const docsChanged = JSON.stringify(documentos) !== localStorage.getItem(`driver_docs_${id}`)
    return changed || notasChanged || docsChanged
  }, [driver, initialSnapshot, notasInternas, initialNotas, documentos, id])

  // Handlers
  const handleInputChange = (field: keyof DriverData, value: string) => {
    if (!driver || isReadOnly) return
    setDriver({ ...driver, [field]: value })
  }

  const handleDocVigenciaChange = (tipo: string, fecha: string) => {
    if (isReadOnly) return
    const today = new Date()
    const selectedDate = new Date(fecha)
    const isExpired = selectedDate < today

    setDocumentos(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        fechaVigencia: fecha,
        isExpired
      }
    }))
  }

  const handleDocStatusChange = (tipo: string, estatus: EstadoDocumento) => {
    if (isReadOnly) return
    setDocumentos(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        estatus
      }
    }))
  }

  const handleViewDocument = async (tipo: string) => {
    setLoadingDoc(tipo)
    // Simular carga de documento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoadingDoc(null)
    alert(`Visualizando documento: ${documentos[tipo]?.label}`)
  }

  const handleDownloadDocument = (tipo: string) => {
    setToastMessage(`Descarga iniciada: ${documentos[tipo]?.label}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleUploadDocument = (tipo: string) => {
    if (isReadOnly) return
    setUploadDocType(tipo)
    setShowUploadModal(true)
    setSelectedFile(null)
    setFileError(null)
    setUploadProgress(0)
  }

  // Validación de archivos permitidos
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ]

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError('Formato no permitido. Solo se aceptan JPG, JPEG, WebP, PNG o PDF.')
      return false
    }
    
    setFileError(null)
    return true
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !uploadDocType) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 15
      })
    }, 200)

    // Simular carga (1-2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500))

    clearInterval(progressInterval)
    setUploadProgress(100)

    // Actualizar el documento a estado "Pendiente"
    setDocumentos(prev => ({
      ...prev,
      [uploadDocType]: {
        ...prev[uploadDocType],
        estatus: "Pendiente",
        fechaVigencia: prev[uploadDocType]?.fechaVigencia || '',
        archivoUrl: URL.createObjectURL(selectedFile),
        isExpired: false
      }
    }))

    // Esperar un momento para ver el 100%
    await new Promise(resolve => setTimeout(resolve, 300))

    setIsUploading(false)
    setShowUploadModal(false)
    setToastMessage(`Documento cargado y reemplazado: ${documentos[uploadDocType]?.label}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)

    // Reset estados
    setSelectedFile(null)
    setUploadDocType(null)
    setUploadProgress(0)
  }

  const handleCloseUploadModal = () => {
    if (isUploading) {
      // Opcional: mostrar confirmación si está cargando
      const confirm = window.confirm('¿Cancelar la carga del documento?')
      if (!confirm) return
    }
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadDocType(null)
    setFileError(null)
    setUploadProgress(0)
    setIsUploading(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Handlers para modal de pedidos
  const recentOrders = useMemo(() => {
    return allOrders.slice(0, 10)
  }, [allOrders])

  const filteredOrders = useMemo(() => {
    if (!orderQuery.trim()) return allOrders
    return allOrders.filter(order => 
      order.orderId.toLowerCase().includes(orderQuery.toLowerCase())
    )
  }, [allOrders, orderQuery])

  const sortedOrders = useMemo(() => {
    const orders = [...filteredOrders]
    orders.sort((a, b) => {
      let aValue: string | number = a[orderSort.key]
      let bValue: string | number = b[orderSort.key]

      if (orderSort.key === 'deliveryDate') {
        aValue = new Date(a.deliveryDate).getTime()
        bValue = new Date(b.deliveryDate).getTime()
      }

      if (aValue < bValue) return orderSort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return orderSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return orders
  }, [filteredOrders, orderSort])

  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderPageSize
    return sortedOrders.slice(startIndex, startIndex + orderPageSize)
  }, [sortedOrders, orderPage, orderPageSize])

  const totalOrderPages = Math.ceil(sortedOrders.length / orderPageSize)

  const handleOpenOrdersModal = () => {
    setShowOrdersModal(true)
    setOrderPage(1)
    setOrderQuery("")
  }

  const handleOrderSort = (key: OrderSortKey) => {
    if (orderSort.key === key) {
      setOrderSort({
        key,
        direction: orderSort.direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      setOrderSort({ key, direction: 'asc' })
    }
    setOrderPage(1)
  }

  const getOrderSortIcon = (key: OrderSortKey) => {
    if (orderSort.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    return orderSort.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Handlers para modal de pagos
  const recentPayments = useMemo(() => {
    return allPayments.slice(0, 6)
  }, [allPayments])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allPayments.map(p => p.year))).sort((a, b) => b - a)
    return years
  }, [allPayments])

  const filteredPayments = useMemo(() => {
    let payments = [...allPayments]
    
    if (paymentFilterYear !== null) {
      payments = payments.filter(p => p.year === paymentFilterYear)
    }
    
    if (paymentFilterWeek !== null) {
      payments = payments.filter(p => p.week === paymentFilterWeek)
    }
    
    return payments
  }, [allPayments, paymentFilterYear, paymentFilterWeek])

  const sortedPayments = useMemo(() => {
    const payments = [...filteredPayments]
    payments.sort((a, b) => {
      let aValue: number
      let bValue: number

      if (paymentSort.key === 'week') {
        // Comparar por año y semana
        if (a.year !== b.year) {
          aValue = a.year
          bValue = b.year
        } else {
          aValue = a.week
          bValue = b.week
        }
      } else {
        aValue = a[paymentSort.key]
        bValue = b[paymentSort.key]
      }

      if (aValue < bValue) return paymentSort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return paymentSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return payments
  }, [filteredPayments, paymentSort])

  const paginatedPayments = useMemo(() => {
    const startIndex = (paymentPage - 1) * paymentPageSize
    return sortedPayments.slice(startIndex, startIndex + paymentPageSize)
  }, [sortedPayments, paymentPage, paymentPageSize])

  const totalPaymentPages = Math.ceil(sortedPayments.length / paymentPageSize)

  const handleOpenPaymentsModal = () => {
    setShowPaymentsModal(true)
    setPaymentPage(1)
    setPaymentFilterYear(null)
    setPaymentFilterWeek(null)
  }

  const handlePaymentSort = (key: PaymentSortKey) => {
    if (paymentSort.key === key) {
      setPaymentSort({
        key,
        direction: paymentSort.direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      setPaymentSort({ key, direction: 'desc' })
    }
    setPaymentPage(1)
  }

  const getPaymentSortIcon = (key: PaymentSortKey) => {
    if (paymentSort.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    return paymentSort.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleOpenReceipt = async (payment: PaymentWeek) => {
    setSelectedReceipt(payment)
    setShowReceiptModal(true)
    setIsLoadingReceipt(true)
    
    // Simular carga del recibo
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoadingReceipt(false)
  }

  const handleDownloadReceipt = () => {
    if (!selectedReceipt) return
    setToastMessage(`Descargando recibo: ${selectedReceipt.year}-W${String(selectedReceipt.week).padStart(2, '0')}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatWeekLabel = (payment: PaymentWeek) => {
    const weekNum = String(payment.week).padStart(2, '0')
    const startDate = new Date(payment.weekStart)
    const endDate = new Date(payment.weekEnd)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    }
    
    return `${payment.year}-W${weekNum} (${formatDate(startDate)} – ${formatDate(endDate)})`
  }

  // Debounce para búsqueda
  useEffect(() => {
    if (!showOrdersModal) return
    
    setIsLoadingOrders(true)
    const timer = setTimeout(() => {
      setIsLoadingOrders(false)
      setOrderPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [orderQuery, showOrdersModal])

  // Loading al cambiar de página o sort
  useEffect(() => {
    if (!showOrdersModal) return
    
    setIsLoadingOrders(true)
    const timer = setTimeout(() => {
      setIsLoadingOrders(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [orderPage, orderSort, showOrdersModal])

  // Loading para pagos al cambiar filtros, página o sort
  useEffect(() => {
    if (!showPaymentsModal) return
    
    setIsLoadingPayments(true)
    const timer = setTimeout(() => {
      setIsLoadingPayments(false)
      if (paymentFilterYear !== null || paymentFilterWeek !== null) {
        setPaymentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [paymentFilterYear, paymentFilterWeek, paymentPage, paymentSort, showPaymentsModal])

  const handleKebabAction = (action: "deshabilitar" | "reactivar" | "suspender") => {
    setPendingAction(action)
    setShowConfirmDialog(true)
  }

  const confirmKebabAction = () => {
    if (!driver || !pendingAction) return

    const session = authProvider.getSession()
    const timestamp = new Date().toISOString()
    const previousStatus = driver.estadoDriver

    if (pendingAction === "deshabilitar") {
      setDriver({ ...driver, estadoDriver: "Deshabilitado" })
      setToastMessage("Driver deshabilitado")
      
      // Registro de auditoría (dummy)
      console.log('=== REGISTRO DE AUDITORÍA ===')
      console.log('action:', 'DRIVER_STATUS_CHANGE')
      console.log('from:', previousStatus)
      console.log('to:', 'Deshabilitado')
      console.log('changedBy:', session?.userName || 'Usuario desconocido')
      console.log('changedAt:', timestamp)
      console.log('driverId:', id)
      console.log('\nIntegraciones: desactivación en sistemas externos (pendiente backend)')
      console.log('==========================')
    } else if (pendingAction === "suspender") {
      setDriver({ ...driver, estadoDriver: "Suspendido" })
      setToastMessage("Driver suspendido correctamente")
      
      // Registro de auditoría (dummy)
      console.log('=== REGISTRO DE AUDITORÍA ===')
      console.log('action:', 'DRIVER_STATUS_CHANGE')
      console.log('from:', previousStatus)
      console.log('to:', 'Suspendido')
      console.log('changedBy:', session?.userName || 'Usuario desconocido')
      console.log('changedAt:', timestamp)
      console.log('driverId:', id)
      console.log('==========================')
    } else {
      setDriver({ ...driver, estadoDriver: "Habilitado" })
      setToastMessage("Driver reactivado")
      
      // Registro de auditoría (dummy)
      console.log('=== REGISTRO DE AUDITORÍA ===')
      console.log('action:', 'DRIVER_STATUS_CHANGE')
      console.log('from:', previousStatus)
      console.log('to:', 'Habilitado')
      console.log('changedBy:', session?.userName || 'Usuario desconocido')
      console.log('changedAt:', timestamp)
      console.log('driverId:', id)
      console.log('\nIntegraciones: activación en sistemas externos (pendiente backend)')
      console.log('==========================')
    }

    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Log de cambios en consola
    console.log('=== CAMBIOS GUARDADOS ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Driver ID:', id)
    
    if (driver && initialSnapshot) {
      const changes: Record<string, { antes: any; despues: any }> = {}
      Object.keys(driver).forEach(key => {
        const k = key as keyof DriverData
        if (driver[k] !== initialSnapshot[k]) {
          changes[key] = {
            antes: initialSnapshot[k],
            despues: driver[k]
          }
        }
      })
      console.log('Campos modificados:', changes)
    }
    
    if (notasInternas !== initialNotas) {
      console.log('Notas modificadas:', {
        antes: initialNotas,
        despues: notasInternas
      })
    }
    
    // Guardar en localStorage
    if (driver) {
      setInitialSnapshot(JSON.parse(JSON.stringify(driver)))
    }
    setInitialNotas(notasInternas)
    localStorage.setItem(`driver_notas_${id}`, notasInternas)
    localStorage.setItem(`driver_docs_${id}`, JSON.stringify(documentos))
    
    setIsSaving(false)
    setToastMessage("Cambios guardados correctamente")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const nombreCompleto = `${driver.nombre} ${driver.apellidoPaterno} ${driver.apellidoMaterno}`
  const session = authProvider.getSession()
  const canSeeInternalNotes = session?.role === "ADMIN_TI" || session?.role === "ADMIN_OPERACIONES"

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6 pb-12">
        {/* Toast */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Confirmar cambio de estatus</CardTitle>
                <CardDescription>
                  {pendingAction === "deshabilitar" 
                    ? "Se cambiará el estatus del driver a 'Deshabilitado'. ¿Confirmar el cambio de estatus?" 
                    : pendingAction === "suspender"
                    ? "Se cambiará el estatus del driver a 'Suspendido'. ¿Confirmar el cambio de estatus?"
                    : "Se cambiará el estatus del driver a 'Habilitado'. ¿Confirmar el cambio de estatus?"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmKebabAction}>
                  {pendingAction === "deshabilitar" ? "Deshabilitar" : pendingAction === "suspender" ? "Suspender" : "Habilitar"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de carga de documentos */}
        {showUploadModal && uploadDocType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle>Cargar documento: {documentos[uploadDocType]?.label}</CardTitle>
                <CardDescription>
                  Selecciona o arrastra el archivo para reemplazar el documento actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zona de carga */}
                {!selectedFile && !isUploading && (
                  <div className="space-y-4">
                    {/* Dropzone */}
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        ${fileError ? 'border-destructive bg-destructive/5' : ''}
                      `}
                    >
                      <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium mb-2">
                        Arrastra y suelta el archivo aquí
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">o</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.jpg,.jpeg,.png,.webp,.pdf'
                          input.onchange = handleFileSelect as any
                          input.click()
                        }}
                      >
                        Seleccionar documento...
                      </Button>
                    </div>

                    {/* Helper text */}
                    <p className="text-xs text-muted-foreground text-center">
                      Formatos permitidos: JPG, JPEG, WebP, PNG, PDF
                    </p>

                    {/* Error message */}
                    {fileError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{fileError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Archivo seleccionado */}
                {selectedFile && !isUploading && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedFile.type || 'Archivo'} • {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Este archivo reemplazará el documento actual y quedará en estado "Pendiente" para validación.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Estado cargando */}
                {isUploading && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{selectedFile?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFile && formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Cargando...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseUploadModal}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      'Cargar documento'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/drivers')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={driver.fotografiaUrl} />
                  <AvatarFallback className="text-lg sm:text-xl font-semibold">
                    {driver.nombre[0]}{driver.apellidoPaterno[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{nombreCompleto}</h1>
                  <p className="text-sm text-muted-foreground">
                    {driver.curp} • {driver.telefono} • {driver.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getBadgeVariant(driver.estadoDriver)}
                  className={driver.estadoDriver === "Suspendido" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                >
                  {driver.estadoDriver}
                </Badge>
                <Badge variant="outline">
                  {driver.incapacidad}
                </Badge>
              </div>
            </div>
          </div>

          {/* Menú kebab */}
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {driver.estadoDriver === "Habilitado" && (
                  <DropdownMenuItem onClick={() => handleKebabAction("deshabilitar")}>
                    Deshabilitar driver
                  </DropdownMenuItem>
                )}
                {(driver.estadoDriver === "Habilitado" || driver.estadoDriver === "Deshabilitado") && (
                  <DropdownMenuItem onClick={() => handleKebabAction("suspender")}>
                    Suspender
                  </DropdownMenuItem>
                )}
                {(driver.estadoDriver === "Deshabilitado" || driver.estadoDriver === "Suspendido") && (
                  <DropdownMenuItem onClick={() => handleKebabAction("reactivar")}>
                    Volver a activar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Banner de solo lectura */}
        {isReadOnly && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {driver.estadoDriver === "Suspendido" 
                ? "Driver suspendido. La información es solo lectura."
                : "Driver deshabilitado. La información es solo lectura."}
            </AlertDescription>
          </Alert>
        )}

        {/* Sección: Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Básicos</CardTitle>
            <CardDescription>Información personal y de contacto del driver</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del Driver */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN PERSONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre(s)</Label>
                  <Input
                    id="nombre"
                    value={driver.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidoPaterno">Apellido Paterno</Label>
                  <Input
                    id="apellidoPaterno"
                    value={driver.apellidoPaterno}
                    onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
                  <Input
                    id="apellidoMaterno"
                    value={driver.apellidoMaterno}
                    onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero">Género</Label>
                  <Select 
                    value={driver.genero} 
                    onValueChange={(value) => handleInputChange('genero', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="genero">
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={driver.fechaNacimiento}
                    onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nacionalidad">Nacionalidad</Label>
                  <Input
                    id="nacionalidad"
                    value={driver.nacionalidad}
                    onChange={(e) => handleInputChange('nacionalidad', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={driver.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={driver.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Identificación oficial */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">IDENTIFICACIÓN OFICIAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="curp">CURP</Label>
                  <Input
                    id="curp"
                    value={driver.curp}
                    onChange={(e) => handleInputChange('curp', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={driver.rfc}
                    onChange={(e) => handleInputChange('rfc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nss">NSS</Label>
                  <Input
                    id="nss"
                    value={driver.nss}
                    onChange={(e) => handleInputChange('nss', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Estatus del Driver */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">ESTATUS DEL DRIVER</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Estatus Driver</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                    <Badge 
                      variant={getBadgeVariant(driver.estadoDriver)}
                      className={driver.estadoDriver === "Suspendido" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                    >
                      {driver.estadoDriver}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Incapacidad</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted text-sm">
                    {driver.incapacidad}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tienda de Último Pedido</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted text-sm">
                    {driver.tiendaUltimoPedido}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Último Check-in</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted text-sm">
                    {driver.fechaUltimoCheckIn.toLocaleString('es-MX')}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Domicilio Personal */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">DOMICILIO PERSONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="calle">Calle</Label>
                  <Input
                    id="calle"
                    value={driver.calle}
                    onChange={(e) => handleInputChange('calle', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroExterior">Número Exterior</Label>
                  <Input
                    id="numeroExterior"
                    value={driver.numeroExterior}
                    onChange={(e) => handleInputChange('numeroExterior', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroInterior">Número Interior</Label>
                  <Input
                    id="numeroInterior"
                    value={driver.numeroInterior}
                    onChange={(e) => handleInputChange('numeroInterior', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colonia">Colonia</Label>
                  <Input
                    id="colonia"
                    value={driver.colonia}
                    onChange={(e) => handleInputChange('colonia', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={driver.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={driver.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    value={driver.codigoPostal}
                    onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Domicilio Fiscal */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">DOMICILIO FISCAL (SOLO LECTURA)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Calle</Label>
                  <Input value={driver.calleFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Número Exterior</Label>
                  <Input value={driver.numeroExteriorFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Número Interior</Label>
                  <Input value={driver.numeroInteriorFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Colonia</Label>
                  <Input value={driver.coloniaFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input value={driver.ciudadFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={driver.estadoFiscal} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Código Postal</Label>
                  <Input value={driver.codigoPostalFiscal} disabled className="bg-muted" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Información Bancaria */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN BANCARIA Y FISCAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={driver.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clabe">CLABE</Label>
                  <Input
                    id="clabe"
                    value={driver.clabe}
                    onChange={(e) => handleInputChange('clabe', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regimenFiscal">Régimen Fiscal</Label>
                  <Input
                    id="regimenFiscal"
                    value={driver.regimenFiscal}
                    onChange={(e) => handleInputChange('regimenFiscal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Información del Vehículo */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">VEHÍCULO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehiculoMarca">Marca</Label>
                  <Input
                    id="vehiculoMarca"
                    value={driver.vehiculoMarca}
                    onChange={(e) => handleInputChange('vehiculoMarca', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiculoModelo">Modelo</Label>
                  <Input
                    id="vehiculoModelo"
                    value={driver.vehiculoModelo}
                    onChange={(e) => handleInputChange('vehiculoModelo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiculoAnio">Año</Label>
                  <Input
                    id="vehiculoAnio"
                    value={driver.vehiculoAnio}
                    onChange={(e) => handleInputChange('vehiculoAnio', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiculoPlacas">Placas</Label>
                  <Input
                    id="vehiculoPlacas"
                    value={driver.vehiculoPlacas}
                    onChange={(e) => handleInputChange('vehiculoPlacas', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiculoColor">Color</Label>
                  <Input
                    id="vehiculoColor"
                    value={driver.vehiculoColor}
                    onChange={(e) => handleInputChange('vehiculoColor', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Beneficiarios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">BENEFICIARIOS</h3>
                  <p className="text-xs text-muted-foreground">El total de porcentajes no debe exceder 100%</p>
                </div>
                {!isReadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!driver) return
                      const beneficiarios = driver.beneficiarios || []
                      const totalPorcentaje = beneficiarios.reduce((sum, b) => sum + b.porcentaje, 0)
                      if (totalPorcentaje >= 100) {
                        alert("El total de porcentajes ya es 100%")
                        return
                      }
                      setDriver({
                        ...driver,
                        beneficiarios: [...beneficiarios, { nombre: "", telefono: "", porcentaje: 0 }]
                      })
                    }}
                  >
                    Agregar Beneficiario
                  </Button>
                )}
              </div>
              {driver.beneficiarios && driver.beneficiarios.length > 0 ? (
                <div className="space-y-3">
                  {driver.beneficiarios.map((beneficiario, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4 p-3 border rounded-lg">
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label htmlFor={`beneficiario-nombre-${index}`} className="text-xs">Nombre Completo</Label>
                        <Input
                          id={`beneficiario-nombre-${index}`}
                          placeholder="Ej. María García López"
                          value={beneficiario.nombre}
                          onChange={(e) => {
                            if (!driver) return
                            const newBeneficiarios = [...(driver.beneficiarios || [])]
                            newBeneficiarios[index].nombre = e.target.value
                            setDriver({ ...driver, beneficiarios: newBeneficiarios })
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`beneficiario-telefono-${index}`} className="text-xs">Teléfono</Label>
                        <Input
                          id={`beneficiario-telefono-${index}`}
                          placeholder="8112345678"
                          value={beneficiario.telefono}
                          onChange={(e) => {
                            if (!driver) return
                            const newBeneficiarios = [...(driver.beneficiarios || [])]
                            newBeneficiarios[index].telefono = e.target.value
                            setDriver({ ...driver, beneficiarios: newBeneficiarios })
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`beneficiario-porcentaje-${index}`} className="text-xs">Porcentaje</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`beneficiario-porcentaje-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            placeholder="50"
                            value={beneficiario.porcentaje}
                            onChange={(e) => {
                              if (!driver) return
                              const newPorcentaje = Number(e.target.value)
                              const newBeneficiarios = [...(driver.beneficiarios || [])]
                              const otrosPorcentaje = newBeneficiarios
                                .filter((_, i) => i !== index)
                                .reduce((sum, b) => sum + b.porcentaje, 0)
                              
                              if (otrosPorcentaje + newPorcentaje > 100) {
                                alert("El total de porcentajes no puede exceder 100%")
                                return
                              }
                              
                              newBeneficiarios[index].porcentaje = newPorcentaje
                              setDriver({ ...driver, beneficiarios: newBeneficiarios })
                            }}
                            disabled={isReadOnly}
                          />
                          {!isReadOnly && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                if (!driver) return
                                const newBeneficiarios = driver.beneficiarios?.filter((_, i) => i !== index) || []
                                setDriver({ ...driver, beneficiarios: newBeneficiarios })
                              }}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <p className="text-sm font-medium">
                      Total: {driver.beneficiarios.reduce((sum, b) => sum + b.porcentaje, 0)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay beneficiarios agregados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección: Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>Gestión de documentos del driver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENTOS_REQUERIDOS.map((doc) => {
                const documento = documentos[doc.tipo]
                if (!documento) return null

                return (
                  <div
                    key={doc.tipo}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      documento.isExpired 
                        ? 'border-red-600 bg-red-50/50 shadow-red-200 shadow-md' 
                        : isExpiringSoon(documento.fechaVigencia)
                        ? 'border-blue-500 bg-blue-50/30 shadow-blue-200 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-base font-semibold">{doc.label}</Label>
                          {documento.isExpired && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <Badge variant="destructive" className="text-xs font-semibold">
                                EXPIRADO
                              </Badge>
                            </div>
                          )}
                          {!documento.isExpired && isExpiringSoon(documento.fechaVigencia) && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <Badge variant="default" className="text-xs font-semibold">
                                Por vencer
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {documento.isExpired && (
                        <Alert className="bg-red-100 border-red-300 py-2">
                          <AlertCircle className="h-4 w-4 text-red-700" />
                          <AlertDescription className="text-xs text-red-800 font-medium">
                            Este documento ha expirado y requiere ser actualizado
                          </AlertDescription>
                        </Alert>
                      )}

                      {!documento.isExpired && isExpiringSoon(documento.fechaVigencia) && (
                        <Alert className="bg-blue-100 border-blue-300 py-2">
                          <Info className="h-4 w-4 text-blue-700" />
                          <AlertDescription className="text-xs text-blue-800 font-medium">
                            Este documento vence en los próximos 30 días
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {getDocumentStatusIcon(documento.estatus)}
                        {getDocumentStatusBadge(documento.estatus)}
                      </div>

                      {doc.tipo !== "nss" && doc.tipo !== "contrato" && doc.tipo !== "cuentaBancaria" && (
                        <div className="space-y-2">
                          <Label 
                            htmlFor={`vigencia-${doc.tipo}`} 
                            className={`text-xs ${
                              documento.isExpired 
                                ? 'text-red-700 font-semibold' 
                                : isExpiringSoon(documento.fechaVigencia)
                                ? 'text-blue-700 font-semibold'
                                : ''
                            }`}
                          >
                            Fecha de vigencia {documento.isExpired && '(Vencida)'} {!documento.isExpired && isExpiringSoon(documento.fechaVigencia) && '(Por vencer)'}
                          </Label>
                          <Input
                            id={`vigencia-${doc.tipo}`}
                            type="date"
                            value={documento.fechaVigencia || ''}
                            onChange={(e) => handleDocVigenciaChange(doc.tipo, e.target.value)}
                            disabled={isReadOnly}
                            className={`w-full ${
                              documento.isExpired 
                                ? 'border-red-500 focus-visible:ring-red-500' 
                                : isExpiringSoon(documento.fechaVigencia)
                                ? 'border-blue-500 focus-visible:ring-blue-500'
                                : ''
                            }`}
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {(documento.estatus === "Validado" || documento.estatus === "Prevalidado") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(doc.tipo)}
                              disabled={loadingDoc === doc.tipo}
                              className="flex-1 min-w-[90px]"
                            >
                              {loadingDoc === doc.tipo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.tipo)}
                              className="flex-1 min-w-[110px]"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUploadDocument(doc.tipo)}
                          disabled={isReadOnly}
                          className="flex-1 min-w-[90px]"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir
                        </Button>
                      </div>
                    </div>

                    {documento.isExpired && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Este documento está expirado y requiere actualización</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sección: Pedidos entregados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pedidos Entregados</CardTitle>
            <CardDescription>Últimos 10 pedidos entregados por el driver</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Este driver aún no tiene pedidos entregados.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID del Pedido</TableHead>
                        <TableHead>Tienda</TableHead>
                        <TableHead>Fecha de Entrega</TableHead>
                        <TableHead>Slot de Entrega</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-sm">
                            {order.orderId}
                          </TableCell>
                          <TableCell>{order.storeName}</TableCell>
                          <TableCell>
                            {new Date(order.deliveryDate).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.deliverySlot}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={handleOpenOrdersModal}>
                    Ver más
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sección: Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>Últimos 6 pagos semanales del driver</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Este driver aún no tiene pagos registrados.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semana</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Monto Pedidos</TableHead>
                        <TableHead className="text-right">Bonos</TableHead>
                        <TableHead className="text-right">Monto Bonos</TableHead>
                        <TableHead className="text-right">Ajuste</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((payment) => (
                        <TableRow key={`${payment.year}-${payment.week}`}>
                          <TableCell>
                            <div className="font-medium">
                              {payment.year}-W{String(payment.week).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.weekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              {' – '}
                              {new Date(payment.weekEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.deliveredOrdersCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.ordersAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.bonusesCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.bonusesAmount)}
                          </TableCell>
                          <TableCell className={`text-right ${payment.adjustmentAmount < 0 ? 'text-red-600' : payment.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>
                            {formatCurrency(payment.adjustmentAmount)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(payment.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {payment.hasReceipt ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleOpenReceipt(payment)}
                                className="h-auto p-0"
                              >
                                Recibo
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground" title="Aún no timbrado">
                                No disponible
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={handleOpenPaymentsModal}>
                    Ver más
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sección: Notas internas */}
        {canSeeInternalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas Internas</CardTitle>
              <CardDescription>
                Solo visible para administradores y coordinadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Escribe notas internas sobre el driver..."
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  rows={5}
                  maxLength={NOTES_MAX_LENGTH}
                  disabled={isReadOnly}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Solo visible para admin y coordinadores</span>
                  <span>
                    {notasInternas.length} / {NOTES_MAX_LENGTH} caracteres
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>

        {/* Modal: Listado de pedidos entregados */}
        {showOrdersModal && driver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => setShowOrdersModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle>
                  Pedidos entregados – {driver.nombre} {driver.apellidoPaterno}
                </CardTitle>
                <CardDescription>
                  Listado completo de pedidos entregados
                </CardDescription>

                {/* Campo de búsqueda */}
                <div className="pt-4">
                  <div className="relative">
                    <Input
                      placeholder="Buscar por ID del pedido..."
                      value={orderQuery}
                      onChange={(e) => setOrderQuery(e.target.value)}
                      className="pr-8"
                    />
                    {orderQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setOrderQuery("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto">
                {isLoadingOrders ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">Cargando pedidos...</p>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : sortedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {orderQuery 
                        ? `No se encontraron pedidos con el ID "${orderQuery}"`
                        : "No hay pedidos entregados"
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleOrderSort('orderId')}
                            >
                              <div className="flex items-center">
                                ID del Pedido
                                {getOrderSortIcon('orderId')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleOrderSort('storeName')}
                            >
                              <div className="flex items-center">
                                Tienda
                                {getOrderSortIcon('storeName')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleOrderSort('deliveryDate')}
                            >
                              <div className="flex items-center">
                                Fecha de Entrega
                                {getOrderSortIcon('deliveryDate')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleOrderSort('deliverySlot')}
                            >
                              <div className="flex items-center">
                                Slot de Entrega
                                {getOrderSortIcon('deliverySlot')}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-mono text-sm">
                                {order.orderId}
                              </TableCell>
                              <TableCell>{order.storeName}</TableCell>
                              <TableCell>
                                {new Date(order.deliveryDate).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {order.deliverySlot}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((orderPage - 1) * orderPageSize) + 1} - {Math.min(orderPage * orderPageSize, sortedOrders.length)} de {sortedOrders.length} resultados
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Selector de tamaño de página */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Mostrar:</span>
                          <Select 
                            value={orderPageSize.toString()} 
                            onValueChange={(v) => {
                              setOrderPageSize(Number(v))
                              setOrderPage(1)
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Controles de paginación */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderPage(Math.max(1, orderPage - 1))}
                            disabled={orderPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>

                          <span className="text-sm text-muted-foreground px-2">
                            Página {orderPage} de {totalOrderPages}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderPage(Math.min(totalOrderPages, orderPage + 1))}
                            disabled={orderPage === totalOrderPages}
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Listado de pagos */}
        {showPaymentsModal && driver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-7xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => setShowPaymentsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle>
                  Pagos – {driver.nombre} {driver.apellidoPaterno}
                </CardTitle>
                <CardDescription>
                  Historial completo de pagos semanales
                </CardDescription>

                {/* Filtros */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-year">Año</Label>
                    <Select
                      value={paymentFilterYear?.toString() || 'all'}
                      onValueChange={(v) => setPaymentFilterYear(v === 'all' ? null : Number(v))}
                    >
                      <SelectTrigger id="filter-year">
                        <SelectValue placeholder="Todos los años" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los años</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-week">Semana</Label>
                    <Select
                      value={paymentFilterWeek?.toString() || 'all'}
                      onValueChange={(v) => setPaymentFilterWeek(v === 'all' ? null : Number(v))}
                    >
                      <SelectTrigger id="filter-week">
                        <SelectValue placeholder="Todas las semanas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las semanas</SelectItem>
                        {Array.from({ length: 53 }, (_, i) => i + 1).map(week => (
                          <SelectItem key={week} value={week.toString()}>
                            Semana {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPaymentFilterYear(null)
                        setPaymentFilterWeek(null)
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto">
                {isLoadingPayments ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">Cargando pagos...</p>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : sortedPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {paymentFilterYear || paymentFilterWeek
                        ? "No se encontraron pagos con los filtros seleccionados"
                        : "No hay pagos registrados"
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border mb-4 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handlePaymentSort('week')}
                            >
                              <div className="flex items-center">
                                Semana
                                {getPaymentSortIcon('week')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('deliveredOrdersCount')}
                            >
                              <div className="flex items-center justify-end">
                                Pedidos
                                {getPaymentSortIcon('deliveredOrdersCount')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('ordersAmount')}
                            >
                              <div className="flex items-center justify-end">
                                Monto Pedidos
                                {getPaymentSortIcon('ordersAmount')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('bonusesCount')}
                            >
                              <div className="flex items-center justify-end">
                                Bonos
                                {getPaymentSortIcon('bonusesCount')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('bonusesAmount')}
                            >
                              <div className="flex items-center justify-end">
                                Monto Bonos
                                {getPaymentSortIcon('bonusesAmount')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('adjustmentAmount')}
                            >
                              <div className="flex items-center justify-end">
                                Ajuste
                                {getPaymentSortIcon('adjustmentAmount')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handlePaymentSort('totalAmount')}
                            >
                              <div className="flex items-center justify-end">
                                Total
                                {getPaymentSortIcon('totalAmount')}
                              </div>
                            </TableHead>
                            <TableHead className="text-center">Recibo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPayments.map((payment) => (
                            <TableRow key={`${payment.year}-${payment.week}`}>
                              <TableCell>
                                <div className="font-medium">
                                  {payment.year}-W{String(payment.week).padStart(2, '0')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(payment.weekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                  {' – '}
                                  {new Date(payment.weekEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {payment.deliveredOrdersCount}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(payment.ordersAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {payment.bonusesCount}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(payment.bonusesAmount)}
                              </TableCell>
                              <TableCell className={`text-right ${payment.adjustmentAmount < 0 ? 'text-red-600' : payment.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>
                                {formatCurrency(payment.adjustmentAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(payment.totalAmount)}
                              </TableCell>
                              <TableCell className="text-center">
                                {payment.hasReceipt ? (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleOpenReceipt(payment)}
                                    className="h-auto p-0"
                                  >
                                    Recibo
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground" title="Aún no timbrado">
                                    No disponible
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((paymentPage - 1) * paymentPageSize) + 1} - {Math.min(paymentPage * paymentPageSize, sortedPayments.length)} de {sortedPayments.length} resultados
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                          disabled={paymentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>

                        <span className="text-sm text-muted-foreground px-2">
                          Página {paymentPage} de {totalPaymentPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentPage(Math.min(totalPaymentPages, paymentPage + 1))}
                          disabled={paymentPage === totalPaymentPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Visualización de recibo */}
        {showReceiptModal && selectedReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => {
                    setShowReceiptModal(false)
                    setSelectedReceipt(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle>
                  Recibo de Pago
                </CardTitle>
                <CardDescription>
                  {formatWeekLabel(selectedReceipt)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto">
                {isLoadingReceipt ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando recibo...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Placeholder para PDF viewer */}
                    <div className="border-2 border-dashed rounded-lg p-12 text-center bg-muted/20">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Recibo Timbrado (PDF)</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedReceipt.year}-W{String(selectedReceipt.week).padStart(2, '0')}
                      </p>
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Pago</p>
                          <p className="font-bold text-lg">{formatCurrency(selectedReceipt.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pedidos Entregados</p>
                          <p className="font-bold text-lg">{selectedReceipt.deliveredOrdersCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      <Button onClick={handleDownloadReceipt}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Recibo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
