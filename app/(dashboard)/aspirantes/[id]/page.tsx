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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Camera,
  Send,
  X
} from "lucide-react"

const moduleKey = "ASPIRANTES"

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
  className = ""
}: { 
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  className?: string
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
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
type EstadoAplicacion = "Pendiente" | "En Revisión" | "Propuesta enviada" | "Aprobado" | "Rechazado"
type EstadoDocumento = "Pendiente" | "No legible" | "Prevalidado" | "Validado"

interface AspiranteData {
  id: string
  // Datos básicos RN01.01
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  telefono: string
  email: string
  ciudad: string
  estado: string
  
  // Datos completos RN01.02
  genero?: string
  fechaNacimiento?: string
  nacionalidad?: string
  rfc?: string
  curp?: string
  nss?: string
  fotografiaUrl?: string
  ciudadInteres?: string
  
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
  
  // Estado
  estadoAplicacion: EstadoAplicacion
  esDriver: boolean
  firmaContrato?: string
  fechaFirmaContrato?: string
  
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
}

interface Propuesta {
  id: string
  tienda: string
  horario: string
  fechaEnvio: string
  estado: "Activa" | "Aceptada" | "Rechazada" | "Expirada"
  expiraEn?: number // milisegundos restantes
  fechaRespuesta?: string // fecha cuando el aspirante aceptó o rechazó
}

const DOCUMENTOS_REQUERIDOS = [
  { tipo: "nss", label: "NSS" },
  { tipo: "licencia", label: "Licencia" },
  { tipo: "seguroAuto", label: "Seguro de Auto" },
  { tipo: "ine", label: "INE" },
  { tipo: "csf", label: "CSF (Constancia de Situación Fiscal)" },
  { tipo: "cuentaBancaria", label: "Carátula cuenta bancaria con CLABE" },
]

const TIENDAS = [
  { value: "heb-cumbres", label: "HEB Cumbres" },
  { value: "heb-lincoln", label: "HEB Lincoln" },
  { value: "mitienda-san-nicolas", label: "Mi Tienda San Nicolás" },
]

const HORARIOS = [
  { value: "matutino", label: "Matutino 7:00 - 15:00", inicio: "7:00", fin: "15:00" },
  { value: "vespertino", label: "Vespertino 14:00 - 22:00", inicio: "14:00", fin: "22:00" },
  { value: "mixto", label: "Mixto 10:00 - 18:00", inicio: "10:00", fin: "18:00" },
]

const MENSAJE_PROPUESTA = "Tenemos una propuesta solo para ti…"

// Mock data - en producción vendría de API
const generarAspiranteMock = (id: string): AspiranteData => {
  // Aspirante de prueba con datos completos y documentos validados
  if (id === "ASP-9999") {
    return {
      id,
      nombre: "Roberto",
      apellidoPaterno: "González",
      apellidoMaterno: "Salazar",
      telefono: "8187654321",
      email: "roberto.gonzalez@email.com",
      ciudad: "Monterrey",
      estado: "Nuevo León",
      genero: "Masculino",
      fechaNacimiento: "1988-08-22",
      nacionalidad: "Mexicana",
      rfc: "GOSR880822XXX",
      curp: "GOSR880822HNLLBT05",
      nss: "98765432109",
      fotografiaUrl: "",
      ciudadInteres: "Monterrey",
      
      // Domicilio Personal - COMPLETO
      calle: "Boulevard Díaz Ordaz",
      numeroExterior: "850",
      numeroInterior: "12A",
      colonia: "Santa María",
      codigoPostal: "64650",
      
      // Domicilio Fiscal (del CSF)
      calleFiscal: "Avenida Constitución",
      numeroExteriorFiscal: "1020",
      numeroInteriorFiscal: "5B",
      coloniaFiscal: "Centro",
      ciudadFiscal: "Monterrey",
      estadoFiscal: "Nuevo León",
      codigoPostalFiscal: "64000",
      
      regimenFiscal: "l",
      banco: "Banorte",
      clabe: "072180012345678901",
      vehiculoMarca: "Nissan",
      vehiculoModelo: "Versa",
      vehiculoAnio: "2021",
      vehiculoPlacas: "XYZ9876",
      vehiculoColor: "Gris",
      estadoAplicacion: "En Revisión",
      esDriver: false,
      fechaFirmaContrato: undefined,
      beneficiarios: [
        { nombre: "Ana María Salazar Ruiz", telefono: "8181234567", porcentaje: 70 },
        { nombre: "Luis González Pérez", telefono: "8189876543", porcentaje: 30 }
      ]
    }
  }
  
  // Aspirante por defecto con datos incompletos
  return {
    id,
    nombre: "Juan",
    apellidoPaterno: "Pérez",
    apellidoMaterno: "García",
    telefono: "8112345678",
    email: "juan.perez@email.com",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    genero: "Masculino",
    fechaNacimiento: "1990-05-15",
    nacionalidad: "Mexicana",
    rfc: "PEGJ900515XXX",
    curp: "PEGJ900515HNLRXN01",
    nss: "12345678901",
    fotografiaUrl: "",
    ciudadInteres: "Monterrey",
    
    // Domicilio Personal
    calle: "Avenida Revolución",
    numeroExterior: "123",
    numeroInterior: "4B",
    colonia: "Centro",
    codigoPostal: "64000",
    
    // Domicilio Fiscal (del CSF)
    calleFiscal: "Calle Morelos",
    numeroExteriorFiscal: "456",
    numeroInteriorFiscal: "2A",
    coloniaFiscal: "Del Valle",
    ciudadFiscal: "Monterrey",
    estadoFiscal: "Nuevo León",
    codigoPostalFiscal: "64100",
    
    regimenFiscal: "l",
    banco: "BBVA",
    clabe: "012180001234567890",
    vehiculoMarca: "Toyota",
    vehiculoModelo: "Corolla",
    vehiculoAnio: "2020",
    vehiculoPlacas: "ABC1234",
    vehiculoColor: "Blanco",
    estadoAplicacion: "Pendiente",
    esDriver: false,
    fechaFirmaContrato: undefined,
    beneficiarios: [
      { nombre: "María García López", telefono: "8199887766", porcentaje: 60 },
      { nombre: "Carlos Pérez García", telefono: "8188776655", porcentaje: 40 }
    ]
  }
}

export default function AspiranteDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Estados
  const [aspirante, setAspirante] = useState<AspiranteData | null>(null)
  const [initialSnapshot, setInitialSnapshot] = useState<AspiranteData | null>(null)
  const [documentos, setDocumentos] = useState<Record<string, Documento>>({})
  const [notasInternas, setNotasInternas] = useState("")
  const [initialNotas, setInitialNotas] = useState("")
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para propuestas
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [selectedTienda, setSelectedTienda] = useState("")
  const [selectedHorario, setSelectedHorario] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [viewerModalOpen, setViewerModalOpen] = useState(false)
  const [viewerDocType, setViewerDocType] = useState("")  
  
  // Estados para validaciones
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Cargar datos iniciales
  useEffect(() => {
    // Simular carga de datos
    const loadData = () => {
      // Intentar cargar desde localStorage primero
      const savedAspirante = localStorage.getItem(`aspirante_${id}`)
      const data = savedAspirante ? JSON.parse(savedAspirante) : generarAspiranteMock(id)
      setAspirante(data)
      setInitialSnapshot(JSON.parse(JSON.stringify(data)))

      // Cargar documentos desde localStorage o inicializar con ejemplos
      const savedDocs = localStorage.getItem(`aspirante_docs_${id}`)
      if (savedDocs) {
        setDocumentos(JSON.parse(savedDocs))
      } else {
        let initialDocs: Record<string, Documento>
        
        // Aspirante de prueba ASP-9999: Todos los documentos validados
        if (id === "ASP-9999") {
          initialDocs = {
            nss: {
              tipo: "nss",
              label: "NSS",
              estatus: "Validado",
              fechaVigencia: "2026-12-31"
            },
            licencia: {
              tipo: "licencia",
              label: "Licencia",
              estatus: "Validado",
              fechaVigencia: "2027-03-15"
            },
            seguroAuto: {
              tipo: "seguroAuto",
              label: "Seguro de Auto",
              estatus: "Validado",
              fechaVigencia: "2026-12-31"
            },
            ine: {
              tipo: "ine",
              label: "INE",
              estatus: "Validado",
              fechaVigencia: "2030-01-01"
            },
            csf: {
              tipo: "csf",
              label: "CSF (Constancia de Situación Fiscal)",
              estatus: "Validado",
              fechaVigencia: "2026-08-20"
            },
            cuentaBancaria: {
              tipo: "cuentaBancaria",
              label: "Carátula cuenta bancaria con CLABE",
              estatus: "Validado"
            }
          }
        } else {
          // Inicializar con ejemplos de diferentes estados (aspirante normal)
          initialDocs = {
            nss: {
              tipo: "nss",
              label: "NSS",
              estatus: "Validado",
              fechaVigencia: "2026-12-31"
            },
            licencia: {
              tipo: "licencia",
              label: "Licencia",
              estatus: "Prevalidado",
              fechaVigencia: "2027-03-15"
            },
            seguroAuto: {
              tipo: "seguroAuto",
              label: "Seguro de Auto",
              estatus: "Pendiente"
            },
            ine: {
              tipo: "ine",
              label: "INE",
              estatus: "No legible"
            },
            csf: {
              tipo: "csf",
              label: "CSF (Constancia de Situación Fiscal)",
              estatus: "Validado",
              fechaVigencia: "2026-08-20"
            },
            cuentaBancaria: {
              tipo: "cuentaBancaria",
              label: "Carátula cuenta bancaria con CLABE",
              estatus: "Prevalidado"
            }
          }
        }
        setDocumentos(initialDocs)
      }

      // Cargar notas internas
      const savedNotas = localStorage.getItem(`aspirante_notas_${id}`) || ""
      setNotasInternas(savedNotas)
      setInitialNotas(savedNotas)
      
      // Cargar propuestas
      const savedPropuestas = localStorage.getItem(`aspirante_propuestas_${id}`)
      if (savedPropuestas) {
        const propuestasData = JSON.parse(savedPropuestas)
        setPropuestas(propuestasData)
      }
    }

    loadData()
  }, [id])
  
  // useEffect para actualizar contador de expiración
  useEffect(() => {
    const interval = setInterval(() => {
      setPropuestas(prev => {
        let cambios = false
        const updated = prev.map(p => {
          if (p.estado === "Activa" && p.expiraEn) {
            const nuevoTiempo = p.expiraEn - 1000
            if (nuevoTiempo <= 0) {
              cambios = true
              return { ...p, estado: "Expirada" as const, expiraEn: 0 }
            }
            return { ...p, expiraEn: nuevoTiempo }
          }
          return p
        })
        
        if (cambios) {
          // Guardar propuestas actualizadas
          localStorage.setItem(`aspirante_propuestas_${id}`, JSON.stringify(updated))
          
          // Si alguna propuesta expiró y el aspirante está en "Propuesta enviada", cambiar a "En Revisión"
          if (aspirante && aspirante.estadoAplicacion === "Propuesta enviada") {
            const aspiranteActualizado = { ...aspirante, estadoAplicacion: "En Revisión" as EstadoAplicacion }
            setAspirante(aspiranteActualizado)
            localStorage.setItem(`aspirante_${id}`, JSON.stringify(aspiranteActualizado))
          }
        }
        
        return updated
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [aspirante, id])

  // Verificar si están completos los datos requeridos (RN01.02)
  const isRequiredComplete = useMemo(() => {
    if (!aspirante) return false
    return !!(
      aspirante.nombre &&
      aspirante.apellidoPaterno &&
      aspirante.apellidoMaterno &&
      aspirante.fechaNacimiento &&
      aspirante.genero &&
      aspirante.nacionalidad &&
      aspirante.ciudadInteres &&
      aspirante.calle &&
      aspirante.numeroExterior &&
      aspirante.colonia &&
      aspirante.ciudad &&
      aspirante.estado &&
      aspirante.codigoPostal &&
      aspirante.vehiculoMarca &&
      aspirante.vehiculoModelo &&
      aspirante.vehiculoAnio &&
      aspirante.vehiculoPlacas &&
      aspirante.banco &&
      aspirante.clabe
    )
  }, [aspirante])

  // Detectar cambios
  const hasChanges = useMemo(() => {
    if (!aspirante || !initialSnapshot) return false
    const changed = JSON.stringify(aspirante) !== JSON.stringify(initialSnapshot)
    const notasChanged = notasInternas !== initialNotas
    return changed || notasChanged
  }, [aspirante, initialSnapshot, notasInternas, initialNotas])

  // Helper para saber si un campo requerido está vacío
  const isRequiredFieldEmpty = (field: keyof AspiranteData): boolean => {
    if (!aspirante) return false
    const requiredFields: Array<keyof AspiranteData> = [
      "nombre", "apellidoPaterno", "apellidoMaterno", "fechaNacimiento",
      "genero", "nacionalidad", "ciudadInteres", "calle", "numeroExterior",
      "colonia", "ciudad", "estado", "codigoPostal", "vehiculoMarca",
      "vehiculoModelo", "vehiculoAnio", "vehiculoPlacas", "banco", "clabe"
    ]
    
    if (!requiredFields.includes(field)) return false
    const value = aspirante[field]
    return !value || (typeof value === "string" && value.trim() === "")
  }

  // Handlers
  const handleInputChange = (field: keyof AspiranteData, value: string) => {
    if (!aspirante) return
    setAspirante({ ...aspirante, [field]: value })
    
    // Validar en tiempo real
    const newErrors = { ...validationErrors }
    
    // Validación de CLABE
    if (field === "clabe") {
      if (value && value.trim() !== "") {
        if (value.length !== 18) {
          newErrors.clabe = `La CLABE debe tener 18 dígitos (actualmente: ${value.length})`
        } else if (!/^\d{18}$/.test(value)) {
          newErrors.clabe = "La CLABE solo debe contener números"
        } else {
          delete newErrors.clabe
        }
      } else {
        delete newErrors.clabe
      }
    }
    
    setValidationErrors(newErrors)
  }

  const handleDocVigenciaChange = (tipo: string, fecha: string) => {
    setDocumentos(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        fechaVigencia: fecha
      }
    }))
  }

  const simulateDocLoad = async (tipo: string) => {
    setLoadingDoc(tipo)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 400))
    setLoadingDoc(null)
  }

  const handleVerDocumento = async (tipo: string) => {
    await simulateDocLoad(tipo)
    setViewerDocType(tipo)
    setViewerModalOpen(true)
  }

  const handleDescargarDocumento = async (tipo: string) => {
    await simulateDocLoad(tipo)
    // Simular descarga
    const blob = new Blob(["Documento dummy"], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${documentos[tipo].label.replace(/ /g, "_")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleEnviarPropuesta = () => {
    if (!selectedTienda || !selectedHorario || !aspirante) return
    
    const tienda = TIENDAS.find(t => t.value === selectedTienda)
    const horario = HORARIOS.find(h => h.value === selectedHorario)
    
    if (!tienda || !horario) return
    
    // Simular alertas dummy (verificaciones)
    const hasActivePropuesta = propuestas.some(p => p.estado === "Activa")
    if (hasActivePropuesta) {
      alert("⚠️ Ya tiene una propuesta activa")
      return
    }
    
    // Crear nueva propuesta
    const nuevaPropuesta: Propuesta = {
      id: `prop-${Date.now()}`,
      tienda: tienda.label,
      horario: `${horario.inicio} - ${horario.fin}`,
      fechaEnvio: new Date().toLocaleString("es-MX", { 
        year: "numeric",
        month: "2-digit", 
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      estado: "Activa",
      expiraEn: 48 * 60 * 60 * 1000 // 48 horas en milisegundos
    }
    
    const nuevasPropuestas = [...propuestas, nuevaPropuesta]
    setPropuestas(nuevasPropuestas)
    localStorage.setItem(`aspirante_propuestas_${id}`, JSON.stringify(nuevasPropuestas))
    
    // Cambiar estado del aspirante
    const aspiranteActualizado = { ...aspirante, estadoAplicacion: "Propuesta enviada" as EstadoAplicacion }
    setAspirante(aspiranteActualizado)
    setInitialSnapshot(aspiranteActualizado) // Actualizar snapshot
    localStorage.setItem(`aspirante_${id}`, JSON.stringify(aspiranteActualizado))
    
    // Mostrar toast
    setToastMessage("✔ Propuesta enviada al aspirante\nPush enviada\nCorreo enviado\nSMS enviado")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
    
    // Cerrar modal y resetear
    setIsProposalModalOpen(false)
    setSelectedTienda("")
    setSelectedHorario("")
  }
  
  // Función mock para simular aceptar/rechazar propuesta (solo para pruebas)
  const handleSimularRespuesta = (propuestaId: string, respuesta: "Aceptada" | "Rechazada") => {
    if (!aspirante) return
    
    const propuestasActualizadas = propuestas.map(p => {
      if (p.id === propuestaId && p.estado === "Activa") {
        return {
          ...p,
          estado: respuesta,
          fechaRespuesta: new Date().toLocaleString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }),
          expiraEn: 0
        }
      }
      return p
    })
    
    setPropuestas(propuestasActualizadas)
    localStorage.setItem(`aspirante_propuestas_${id}`, JSON.stringify(propuestasActualizadas))
    
    // Cambiar estado del aspirante
    const nuevoEstado = respuesta === "Aceptada" ? "Aprobado" : "En Revisión"
    const aspiranteActualizado = { ...aspirante, estadoAplicacion: nuevoEstado as EstadoAplicacion }
    setAspirante(aspiranteActualizado)
    setInitialSnapshot(aspiranteActualizado)
    localStorage.setItem(`aspirante_${id}`, JSON.stringify(aspiranteActualizado))
  }
  
  // Función para eliminar todas las propuestas (solo para pruebas - ASP-9999)
  const handleEliminarPropuestas = () => {
    if (!aspirante) return
    
    setPropuestas([])
    localStorage.removeItem(`aspirante_propuestas_${id}`)
    
    // Cambiar estado del aspirante a "En Revisión"
    const aspiranteActualizado = { ...aspirante, estadoAplicacion: "En Revisión" as EstadoAplicacion }
    setAspirante(aspiranteActualizado)
    setInitialSnapshot(aspiranteActualizado)
    localStorage.setItem(`aspirante_${id}`, JSON.stringify(aspiranteActualizado))
  }
  
  const canSendProposal = useMemo(() => {
    // Verificar que no haya propuesta activa
    const hasActivePropuesta = propuestas.some(p => p.estado === "Activa")
    if (hasActivePropuesta) return false
    
    // Verificar datos completos (RN02)
    if (!isRequiredComplete) return false

    // Verificar documentos requeridos (RN07)
    const documentosValidados = DOCUMENTOS_REQUERIDOS.every(doc => {
      const documento = documentos[doc.tipo]
      return documento && (documento.estatus === "Validado" || documento.estatus === "Prevalidado")
    })

    return documentosValidados
  }, [propuestas, isRequiredComplete, documentos])
  
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleGuardarCambios = async () => {
    if (!aspirante || !initialSnapshot) return

    // Verificar si hay errores de validación
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSaving(true)

    // Comparar cambios
    const changedFields: Record<string, { before: any, after: any }> = {}
    Object.keys(aspirante).forEach(key => {
      const k = key as keyof AspiranteData
      if (aspirante[k] !== initialSnapshot[k]) {
        changedFields[key] = {
          before: initialSnapshot[k],
          after: aspirante[k]
        }
      }
    })

    if (notasInternas !== initialNotas) {
      changedFields["notasInternas"] = {
        before: initialNotas,
        after: notasInternas
      }
    }

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Actualizar estado si cumple requeridos
    let updatedAspirante = { ...aspirante }
    if (isRequiredComplete && aspirante.estadoAplicacion === "Pendiente") {
      updatedAspirante.estadoAplicacion = "En Revisión"
    }

    // Guardar en localStorage
    localStorage.setItem(`aspirante_${id}`, JSON.stringify(updatedAspirante))
    localStorage.setItem(`aspirante_notas_${id}`, notasInternas)
    localStorage.setItem(`aspirante_docs_${id}`, JSON.stringify(documentos))

    // Registrar log de cambios
    const changeLog = {
      timestamp: new Date().toISOString(),
      aspirantId: id,
      changedFields
    }
    const logs = JSON.parse(localStorage.getItem(`change_logs`) || "[]")
    logs.push(changeLog)
    localStorage.setItem(`change_logs`, JSON.stringify(logs))

    // Actualizar snapshots
    setAspirante(updatedAspirante)
    setInitialSnapshot(JSON.parse(JSON.stringify(updatedAspirante)))
    setInitialNotas(notasInternas)
    setIsSaving(false)

    alert("Cambios guardados exitosamente")
  }

  const getEstadoDocBadgeVariant = (estatus: EstadoDocumento) => {
    switch (estatus) {
      case "Validado": return "default"
      case "Prevalidado": return "default"
      case "No legible": return "destructive"
      case "Pendiente": return "destructive"
      default: return "outline"
    }
  }

  const getEstadoDocIcon = (estatus: EstadoDocumento) => {
    switch (estatus) {
      case "Validado": return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
      case "Prevalidado": return <Clock className="h-3.5 w-3.5 text-blue-600" />
      case "No legible": return <XCircle className="h-3.5 w-3.5 text-red-600" />
      default: return <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
    }
  }

  if (!aspirante) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Obtener rol del usuario actual
  const currentUserRole = authProvider.getSession()?.role

  // Permitir edición si no es driver, o si el usuario es admin
  const isEditable = !aspirante.esDriver || currentUserRole === "ADMIN_TI" || currentUserRole === "ADMIN_OPERACIONES"

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6 pb-12">
        {/* Banner informativo para aspirante de prueba */}
        {id === "ASP-9999" && (
          <Alert className="bg-blue-50 border-blue-300">
            <AlertCircle className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-900 font-semibold">Aspirante de Prueba</AlertTitle>
            <AlertDescription className="text-blue-800">
              Este es un escenario de prueba con todos los datos completos y documentos validados. 
              Puedes usar este aspirante para probar el flujo de envío de propuesta.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/aspirantes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={aspirante.fotografiaUrl || ""} alt={`${aspirante.nombre} ${aspirante.apellidoPaterno}`} />
                <AvatarFallback className="text-lg sm:text-xl font-semibold">
                  {aspirante.nombre.charAt(0)}{aspirante.apellidoPaterno.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditable && (
                <label 
                  htmlFor="foto-upload" 
                  className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                  title="Cambiar fotografía"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Cambiar fotografía de perfil"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const newErrors = { ...validationErrors }
                        if (file.size > 2.5 * 1024 * 1024) {
                          newErrors.foto = "La imagen no debe superar 2.5MB"
                          setValidationErrors(newErrors)
                          e.target.value = ""
                        } else {
                          delete newErrors.foto
                          setValidationErrors(newErrors)
                          handleInputChange("fotografiaUrl", URL.createObjectURL(file))
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {validationErrors.foto && (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.foto}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                {aspirante.nombre} {aspirante.apellidoPaterno} {aspirante.apellidoMaterno}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">ID: {aspirante.id}</p>
                <Badge variant={
                  aspirante.estadoAplicacion === "Aprobado" ? "default" :
                  aspirante.estadoAplicacion === "Rechazado" ? "destructive" :
                  "secondary"
                }>
                  {aspirante.estadoAplicacion}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {aspirante.esDriver && (
              <Badge variant="outline">Driver Activo</Badge>
            )}
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Fecha Firma de Contrato</p>
              <p className="text-sm font-medium text-foreground">
                {aspirante.estadoAplicacion === "Aprobado" && aspirante.fechaFirmaContrato ? 
                  new Date(aspirante.fechaFirmaContrato).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Sección 1: Datos Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Datos Básicos</CardTitle>
            <CardDescription className="text-xs">
              Información personal y de contacto del aspirante
              {aspirante.esDriver && !isEditable && " (Solo lectura - Ya es driver)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
          <div className="space-y-8">
            {/* Datos personales */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre" className={isRequiredFieldEmpty("nombre") ? "text-destructive font-semibold" : ""}>Nombre(s) *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Juan Carlos"
                  value={aspirante.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  disabled={!isEditable}
                  className={isRequiredFieldEmpty("nombre") ? "border-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="apellidoPaterno" className={isRequiredFieldEmpty("apellidoPaterno") ? "text-destructive font-semibold" : ""}>Apellido Paterno *</Label>
                <Input
                  id="apellidoPaterno"
                  placeholder="Ej. Pérez"
                  value={aspirante.apellidoPaterno}
                  onChange={(e) => handleInputChange("apellidoPaterno", e.target.value)}
                  disabled={!isEditable}
                  className={isRequiredFieldEmpty("apellidoPaterno") ? "border-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="apellidoMaterno" className={isRequiredFieldEmpty("apellidoMaterno") ? "text-destructive font-semibold" : ""}>Apellido Materno *</Label>
                <Input
                  id="apellidoMaterno"
                  placeholder="Ej. García"
                  value={aspirante.apellidoMaterno}
                  onChange={(e) => handleInputChange("apellidoMaterno", e.target.value)}
                  disabled={!isEditable}
                  className={isRequiredFieldEmpty("apellidoMaterno") ? "border-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fechaNacimiento" className={isRequiredFieldEmpty("fechaNacimiento") ? "text-destructive font-semibold" : ""}>Fecha de Nacimiento *</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={aspirante.fechaNacimiento || ""}
                  onChange={(e) => handleInputChange("fechaNacimiento", e.target.value)}
                  disabled={!isEditable}
                  className={isRequiredFieldEmpty("fechaNacimiento") ? "border-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="genero" className={isRequiredFieldEmpty("genero") ? "text-destructive font-semibold" : ""}>Género *</Label>
                <Select
                  value={aspirante.genero || ""}
                  onValueChange={(value) => handleInputChange("genero", value)}
                  disabled={!isEditable}
                >
                  <SelectTrigger className={isRequiredFieldEmpty("genero") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nacionalidad" className={isRequiredFieldEmpty("nacionalidad") ? "text-destructive font-semibold" : ""}>Nacionalidad *</Label>
                <Input
                  id="nacionalidad"
                  placeholder="Ej. Mexicana"
                  value={aspirante.nacionalidad || ""}
                  onChange={(e) => handleInputChange("nacionalidad", e.target.value)}
                  disabled={!isEditable}
                  className={isRequiredFieldEmpty("nacionalidad") ? "border-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  placeholder="PEGJ900515XXX"
                  value={aspirante.rfc || ""}
                  onChange={(e) => handleInputChange("rfc", e.target.value)}
                  disabled={!isEditable}
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="curp">CURP</Label>
                <Input
                  id="curp"
                  placeholder="PEGJ900515HNLRXN01"
                  value={aspirante.curp || ""}
                  onChange={(e) => handleInputChange("curp", e.target.value)}
                  disabled={!isEditable}
                />
              </div>
              <div className="col-span-1 md:col-span-1 flex flex-col gap-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={aspirante.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="8112345678"
                  value={aspirante.telefono}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ciudadInteres" className={isRequiredFieldEmpty("ciudadInteres") ? "text-destructive font-semibold" : ""}>Ciudad de interés *</Label>
                <Select
                  value={aspirante.ciudadInteres || ""}
                  onValueChange={(value) => handleInputChange("ciudadInteres", value)}
                  disabled={!isEditable}
                >
                  <SelectTrigger className={isRequiredFieldEmpty("ciudadInteres") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monterrey">Monterrey</SelectItem>
                    <SelectItem value="Guadalupe">Guadalupe</SelectItem>
                    <SelectItem value="San Pedro">San Pedro</SelectItem>
                    <SelectItem value="Apodaca">Apodaca</SelectItem>
                    <SelectItem value="Escobedo">Escobedo</SelectItem>
                    <SelectItem value="Santa Catarina">Santa Catarina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Domicilio Personal */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Domicilio Personal</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="calle" className={isRequiredFieldEmpty("calle") ? "text-destructive font-semibold" : ""}>Calle *</Label>
                  <Input
                    id="calle"
                    placeholder="Ej. Avenida Revolución"
                    value={aspirante.calle || ""}
                    onChange={(e) => handleInputChange("calle", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("calle") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numeroExterior" className={isRequiredFieldEmpty("numeroExterior") ? "text-destructive font-semibold" : ""}>Número Exterior *</Label>
                  <Input
                    id="numeroExterior"
                    placeholder="123"
                    value={aspirante.numeroExterior || ""}
                    onChange={(e) => handleInputChange("numeroExterior", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("numeroExterior") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numeroInterior">Número Interior</Label>
                  <Input
                    id="numeroInterior"
                    placeholder="4B"
                    value={aspirante.numeroInterior || ""}
                    onChange={(e) => handleInputChange("numeroInterior", e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="codigoPostal" className={isRequiredFieldEmpty("codigoPostal") ? "text-destructive font-semibold" : ""}>Código Postal *</Label>
                  <Input
                    id="codigoPostal"
                    placeholder="64000"
                    value={aspirante.codigoPostal || ""}
                    onChange={(e) => handleInputChange("codigoPostal", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("codigoPostal") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="colonia" className={isRequiredFieldEmpty("colonia") ? "text-destructive font-semibold" : ""}>Colonia *</Label>
                  <Input
                    id="colonia"
                    placeholder="Centro"
                    value={aspirante.colonia || ""}
                    onChange={(e) => handleInputChange("colonia", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("colonia") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ciudad" className={isRequiredFieldEmpty("ciudad") ? "text-destructive font-semibold" : ""}>Ciudad/Municipio *</Label>
                  <Input
                    id="ciudad"
                    placeholder="Monterrey"
                    value={aspirante.ciudad}
                    onChange={(e) => handleInputChange("ciudad", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("ciudad") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estado" className={isRequiredFieldEmpty("estado") ? "text-destructive font-semibold" : ""}>Estado *</Label>
                  <Input
                    id="estado"
                    placeholder="Nuevo León"
                    value={aspirante.estado}
                    onChange={(e) => handleInputChange("estado", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("estado") ? "border-destructive" : ""}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Domicilio Fiscal */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Domicilio Fiscal</h3>
              <p className="text-sm text-muted-foreground">Datos obtenidos de la Constancia de Situación Fiscal (solo lectura)</p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="calleFiscal">Calle</Label>
                  <Input
                    id="calleFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.calleFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numeroExteriorFiscal">Número Exterior</Label>
                  <Input
                    id="numeroExteriorFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.numeroExteriorFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numeroInteriorFiscal">Número Interior</Label>
                  <Input
                    id="numeroInteriorFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.numeroInteriorFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="codigoPostalFiscal">Código Postal</Label>
                  <Input
                    id="codigoPostalFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.codigoPostalFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="coloniaFiscal">Colonia</Label>
                  <Input
                    id="coloniaFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.coloniaFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ciudadFiscal">Ciudad/Municipio</Label>
                  <Input
                    id="ciudadFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.ciudadFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estadoFiscal">Estado</Label>
                  <Input
                    id="estadoFiscal"
                    placeholder="Datos del CSF"
                    value={aspirante.estadoFiscal || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-1 mt-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="regimenFiscal">Régimen Fiscal</Label>
                  <Select
                    value={aspirante.regimenFiscal || ""}
                    disabled
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Datos del CSF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Sueldos y Salarios e Ingresos Asimilados a Salarios</SelectItem>
                      <SelectItem value="b">Arrendamiento</SelectItem>
                      <SelectItem value="c">Régimen de Enajenación o Adquisición de Bienes</SelectItem>
                      <SelectItem value="d">Demás ingresos</SelectItem>
                      <SelectItem value="e">Residentes en el Extranjero sin Establecimiento Permanente en México</SelectItem>
                      <SelectItem value="f">Ingresos por Dividendos (socios y accionistas)</SelectItem>
                      <SelectItem value="g">Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                      <SelectItem value="h">Ingresos por intereses</SelectItem>
                      <SelectItem value="i">Régimen de los ingresos por obtención de premios</SelectItem>
                      <SelectItem value="j">Sin obligaciones fiscales</SelectItem>
                      <SelectItem value="k">Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</SelectItem>
                      <SelectItem value="l">Régimen Simplificado de Confianza (RESICO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vehículo */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Datos del Vehículo</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-1 md:col-span-1 lg:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="vehiculoMarca" className={isRequiredFieldEmpty("vehiculoMarca") ? "text-destructive font-semibold" : ""}>Marca *</Label>
                  <Input
                    id="vehiculoMarca"
                    placeholder="Toyota"
                    value={aspirante.vehiculoMarca}
                    onChange={(e) => handleInputChange("vehiculoMarca", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("vehiculoMarca") ? "border-destructive" : ""}
                  />
                </div>
                <div className="col-span-1 md:col-span-1 lg:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="vehiculoModelo" className={isRequiredFieldEmpty("vehiculoModelo") ? "text-destructive font-semibold" : ""}>Modelo *</Label>
                  <Input
                    id="vehiculoModelo"
                    placeholder="Corolla"
                    value={aspirante.vehiculoModelo}
                    onChange={(e) => handleInputChange("vehiculoModelo", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("vehiculoModelo") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vehiculoAnio" className={isRequiredFieldEmpty("vehiculoAnio") ? "text-destructive font-semibold" : ""}>Año *</Label>
                  <Input
                    id="vehiculoAnio"
                    placeholder="2020"
                    value={aspirante.vehiculoAnio}
                    onChange={(e) => handleInputChange("vehiculoAnio", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("vehiculoAnio") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vehiculoPlacas" className={isRequiredFieldEmpty("vehiculoPlacas") ? "text-destructive font-semibold" : ""}>Placas *</Label>
                  <Input
                    id="vehiculoPlacas"
                    placeholder="ABC1234"
                    value={aspirante.vehiculoPlacas}
                    onChange={(e) => handleInputChange("vehiculoPlacas", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("vehiculoPlacas") ? "border-destructive" : ""}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="vehiculoColor">Color</Label>
                  <Input
                    id="vehiculoColor"
                    placeholder="Blanco"
                    value={aspirante.vehiculoColor}
                    onChange={(e) => handleInputChange("vehiculoColor", e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Datos bancarios */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Datos Bancarios</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="banco" className={isRequiredFieldEmpty("banco") ? "text-destructive font-semibold" : ""}>Banco *</Label>
                  <Input
                    id="banco"
                    placeholder="BBVA"
                    value={aspirante.banco || ""}
                    onChange={(e) => handleInputChange("banco", e.target.value)}
                    disabled={!isEditable}
                    className={isRequiredFieldEmpty("banco") ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="clabe" className={isRequiredFieldEmpty("clabe") ? "text-destructive font-semibold" : ""}>CLABE *</Label>
                  <Input
                    id="clabe"
                    placeholder="012180001234567890"
                    value={aspirante.clabe || ""}
                    onChange={(e) => handleInputChange("clabe", e.target.value)}
                    disabled={!isEditable}
                    maxLength={18}
                    className={validationErrors.clabe ? "border-destructive" : isRequiredFieldEmpty("clabe") ? "border-destructive" : ""}
                  />
                  {validationErrors.clabe && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.clabe}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Beneficiarios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Beneficiarios</h3>
                  <p className="text-sm text-muted-foreground">El total de porcentajes no debe exceder 100%</p>
                </div>
                {isEditable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const beneficiarios = aspirante.beneficiarios || []
                      const totalPorcentaje = beneficiarios.reduce((sum, b) => sum + b.porcentaje, 0)
                      if (totalPorcentaje >= 100) {
                        alert("El total de porcentajes ya es 100%")
                        return
                      }
                      setAspirante({
                        ...aspirante,
                        beneficiarios: [...beneficiarios, { nombre: "", telefono: "", porcentaje: 0 }]
                      })
                    }}
                  >
                    Agregar Beneficiario
                  </Button>
                )}
              </div>
              {aspirante.beneficiarios && aspirante.beneficiarios.length > 0 ? (
                <div className="space-y-4">
                  {aspirante.beneficiarios.map((beneficiario, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-4 p-4 border rounded-lg">
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <Label htmlFor={`beneficiario-nombre-${index}`}>Nombre Completo *</Label>
                        <Input
                          id={`beneficiario-nombre-${index}`}
                          placeholder="Ej. María García López"
                          value={beneficiario.nombre}
                          onChange={(e) => {
                            const newBeneficiarios = [...(aspirante.beneficiarios || [])]
                            newBeneficiarios[index].nombre = e.target.value
                            setAspirante({ ...aspirante, beneficiarios: newBeneficiarios })
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`beneficiario-telefono-${index}`}>Teléfono *</Label>
                        <Input
                          id={`beneficiario-telefono-${index}`}
                          placeholder="8112345678"
                          value={beneficiario.telefono}
                          onChange={(e) => {
                            const newBeneficiarios = [...(aspirante.beneficiarios || [])]
                            newBeneficiarios[index].telefono = e.target.value
                            setAspirante({ ...aspirante, beneficiarios: newBeneficiarios })
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`beneficiario-porcentaje-${index}`}>Porcentaje *</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`beneficiario-porcentaje-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            placeholder="50"
                            value={beneficiario.porcentaje}
                            onChange={(e) => {
                              const newPorcentaje = Number(e.target.value)
                              const newBeneficiarios = [...(aspirante.beneficiarios || [])]
                              const otrosPorcentaje = newBeneficiarios
                                .filter((_, i) => i !== index)
                                .reduce((sum, b) => sum + b.porcentaje, 0)
                              
                              if (otrosPorcentaje + newPorcentaje > 100) {
                                alert("El total de porcentajes no puede exceder 100%")
                                return
                              }
                              
                              newBeneficiarios[index].porcentaje = newPorcentaje
                              setAspirante({ ...aspirante, beneficiarios: newBeneficiarios })
                            }}
                            disabled={!isEditable}
                          />
                          {isEditable && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const newBeneficiarios = aspirante.beneficiarios?.filter((_, i) => i !== index) || []
                                setAspirante({ ...aspirante, beneficiarios: newBeneficiarios })
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
                      Total: {aspirante.beneficiarios.reduce((sum, b) => sum + b.porcentaje, 0)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay beneficiarios agregados</p>
              )}
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Sección 2: Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Documentos</CardTitle>
            <CardDescription className="text-xs">
              Gestión de documentación requerida
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="grid gap-2 md:grid-cols-2">
              {DOCUMENTOS_REQUERIDOS.map(doc => {
                const documento = documentos[doc.tipo] || { tipo: doc.tipo, label: doc.label, estatus: "Pendiente" }
                const isWarning = documento.estatus === "Pendiente" || documento.estatus === "No legible"
                const isLoading = loadingDoc === doc.tipo

                return (
                  <div
                    key={doc.tipo}
                    className={`p-2.5 border rounded-md space-y-2 overflow-hidden ${isWarning ? "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{documento.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getEstadoDocIcon(documento.estatus)}
                          <Badge variant={getEstadoDocBadgeVariant(documento.estatus)} className="text-[10px] h-5 px-1.5">
                            {documento.estatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end gap-2 min-w-0">
                      {doc.tipo !== "nss" && doc.tipo !== "contrato" && doc.tipo !== "cuentaBancaria" && (
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <Label htmlFor={`vigencia-${doc.tipo}`} className="text-[10px] text-muted-foreground">
                            Vigencia
                          </Label>
                          <Input
                            id={`vigencia-${doc.tipo}`}
                            type="date"
                            value={documento.fechaVigencia || ""}
                            onChange={(e) => handleDocVigenciaChange(doc.tipo, e.target.value)}
                            className="h-8 text-xs w-full bg-muted"
                            disabled
                          />
                        </div>
                      )}

                      {(documento.estatus === "Validado" || documento.estatus === "Prevalidado") && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleVerDocumento(doc.tipo)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleDescargarDocumento(doc.tipo)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Propuestas de Trabajo */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Propuestas de Trabajo</CardTitle>
                <CardDescription className="text-xs">
                  Gestión de propuestas laborales
                </CardDescription>
              </div>
              <div className="relative group w-full sm:w-auto">
                <Sheet open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
                  <SheetTrigger asChild>
                    <Button
                      disabled={!canSendProposal}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar propuesta...
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Enviar propuesta</SheetTitle>
                    <SheetDescription>
                      Selecciona la tienda y horario para enviar la propuesta al aspirante
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="space-y-6 mt-6">
                    {/* Selects */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tienda">Tienda</Label>
                        <Select value={selectedTienda} onValueChange={setSelectedTienda}>
                          <SelectTrigger id="tienda">
                            <SelectValue placeholder="Selecciona tienda ▼" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIENDAS.map(tienda => (
                              <SelectItem key={tienda.value} value={tienda.value}>
                                {tienda.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="horario">Horario</Label>
                        <Select value={selectedHorario} onValueChange={setSelectedHorario}>
                          <SelectTrigger id="horario">
                            <SelectValue placeholder="Selecciona horario ▼" />
                          </SelectTrigger>
                          <SelectContent>
                            {HORARIOS.map(horario => (
                              <SelectItem key={horario.value} value={horario.value}>
                                {horario.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Preview del mensaje */}
                    {selectedTienda && selectedHorario && (
                      <div className="p-4 bg-muted rounded-md space-y-2">
                        <Label>Vista previa del mensaje</Label>
                        <div className="text-sm">
                          <p className="font-medium mb-2">{MENSAJE_PROPUESTA}</p>
                          <p>Trabajarías en: <strong>{TIENDAS.find(t => t.value === selectedTienda)?.label}</strong></p>
                          <p>Horario: <strong>{HORARIOS.find(h => h.value === selectedHorario)?.label}</strong></p>
                        </div>
                      </div>
                    )}
                    
                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsProposalModalOpen(false)
                          setSelectedTienda("")
                          setSelectedHorario("")
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleEnviarPropuesta}
                        disabled={!selectedTienda || !selectedHorario}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {/* Mostrar propuestas si existen */}
            {propuestas.length > 0 ? (
              <div className="space-y-4">
                {/* Botón para eliminar propuestas (solo para pruebas - ASP-9999) */}
                {id === "ASP-9999" && (
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleEliminarPropuestas}
                    >
                      <X className="h-4 w-4 mr-2" />
                      [MOCK] Eliminar todas las propuestas
                    </Button>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mb-2">
                  Mostrando las últimas 5 propuestas (de más reciente a más antigua)
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Fecha envío</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha respuesta</TableHead>
                      <TableHead>Tiempo restante</TableHead>
                      {id === "ASP-9999" && <TableHead>Acciones (Mock)</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propuestas
                      .sort((a, b) => {
                        try {
                          const fechaA = new Date(a.fechaEnvio).getTime()
                          const fechaB = new Date(b.fechaEnvio).getTime()
                          return fechaB - fechaA // Más reciente primero
                        } catch (error) {
                          return 0 // Si hay error, mantener orden original
                        }
                      })
                      .slice(0, 5)
                      .map(propuesta => (
                      <TableRow key={propuesta.id}>
                        <TableCell className="font-medium">{propuesta.tienda}</TableCell>
                        <TableCell>{propuesta.horario}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{propuesta.fechaEnvio}</TableCell>
                        <TableCell>
                          <Badge variant={
                            propuesta.estado === "Activa" ? "default" :
                            propuesta.estado === "Aceptada" ? "default" :
                            propuesta.estado === "Rechazada" ? "destructive" :
                            propuesta.estado === "Expirada" ? "secondary" :
                            "secondary"
                          }>
                            {propuesta.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {propuesta.fechaRespuesta || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {propuesta.estado === "Activa" && propuesta.expiraEn ? (
                            <span className="font-mono">{formatTimeRemaining(propuesta.expiraEn)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {id === "ASP-9999" && (
                          <TableCell>
                            {propuesta.estado === "Activa" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSimularRespuesta(propuesta.id, "Aceptada")}
                                  className="text-xs"
                                >
                                  Aceptar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSimularRespuesta(propuesta.id, "Rechazada")}
                                  className="text-xs"
                                >
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !canSendProposal ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-base font-bold mb-2">Botón "Enviar propuesta..." deshabilitado</h3>
                <div className="text-sm text-muted-foreground max-w-md space-y-2">
                  {!isRequiredComplete && (
                    <p>• Completa los datos requeridos (marcados con *)</p>
                  )}
                  {isRequiredComplete && !DOCUMENTOS_REQUERIDOS.every(doc => {
                    const documento = documentos[doc.tipo]
                    return documento && (documento.estatus === "Validado" || documento.estatus === "Prevalidado")
                  }) && (
                    <p>• Todos los documentos deben estar en estado Validado o Prevalidado</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No hay propuestas enviadas aún.</p>
                <p className="text-xs text-muted-foreground mt-1">Usa el botón &quot;Enviar propuesta...&quot; para crear una.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Toast notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-md animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium whitespace-pre-line">{toastMessage}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sección 4: Notas Internas */}
        <RoleSpecificGuard requiredRoles={["ADMIN_TI", "ADMIN_OPERACIONES"]}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Notas Internas</CardTitle>
              <CardDescription className="text-xs">
                Solo visible para Admin TI y Admin Operaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Escribe notas internas sobre este aspirante..."
                value={notasInternas}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotasInternas(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        </RoleSpecificGuard>

        {/* Botón Guardar Cambios */}
        <div className="flex justify-end gap-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/aspirantes')}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardarCambios}
            disabled={!hasChanges || isSaving || !isEditable || Object.keys(validationErrors).length > 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>

        {/* Modal de Viewer de Documentos */}
        <Sheet open={viewerModalOpen} onOpenChange={setViewerModalOpen}>
          <SheetContent className="w-full sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Visualizar Documento</SheetTitle>
              <SheetDescription>
                {viewerDocType && documentos[viewerDocType]?.label}
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 flex items-center justify-center bg-muted rounded-lg p-8 min-h-[400px]">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Vista previa del documento (simulado)
                </p>
                <p className="text-xs text-muted-foreground">
                  En producción, aquí se mostraría el PDF/imagen real del documento
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleDescargarDocumento(viewerDocType)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar documento
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </RoleGuard>
  )
}
