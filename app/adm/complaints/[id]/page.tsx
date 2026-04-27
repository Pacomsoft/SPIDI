"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RoleGuard } from "@/modules/adm/application/presentation/components/role-guard"
import { createCheckModuleAccessUseCase } from "@/modules/adm/infrastructure/dependency-injection"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Send,
  User,
  MessageSquare,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Shield,
  Eye,
  Download
} from "lucide-react"

const checkModuleAccessUseCase = createCheckModuleAccessUseCase()
const moduleKey = "COMUNICACION"

// Tipos
type ComplaintType = "Queja" | "Aclaración" | "Comentario"
type ComplaintStatus = "Nueva" | "En proceso" | "Resuelta"
type MessageAuthor = "Driver" | "Soporte"
type AttachmentType = "pdf" | "jpg" | "png" | "webp"

interface MessageAttachment {
  id: string
  name: string
  type: AttachmentType
  size: number // bytes
  url: string // dummy URL
}

interface ComplaintMessage {
  id: string
  author: MessageAuthor
  sentAt: string
  text: string
  attachments?: MessageAttachment[]
}

interface ComplaintDetail {
  id: string
  type: ComplaintType
  receivedAt: string
  status: ComplaintStatus
  driver: {
    id: string
    name: string
    rfc: string
    phone: string
    email: string
  }
  initialMessage: string
  messages: ComplaintMessage[]
}

// Generar datos dummy para el detalle
const generateComplaintDetail = (id: string): ComplaintDetail | null => {
  // IDs válidos: QA-1000 a QA-1236
  const numericId = parseInt(id.replace('QA-', ''))
  if (isNaN(numericId) || numericId < 1000 || numericId > 1236) {
    return null
  }

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

  const driverIndex = (numericId - 1000) % nombres.length
  const nombre = nombres[driverIndex]
  const rfcBase = nombre.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
  const rfc = `${rfcBase}${String(800101 + driverIndex).slice(-6)}${String.fromCharCode(65 + (driverIndex % 26))}${String.fromCharCode(65 + ((driverIndex * 2) % 26))}${driverIndex % 10}`
  const driverId = `DRV-${String(100 + (driverIndex % 24)).padStart(3, '0')}`

  // Fecha de recepción (hace X días)
  const now = new Date()
  const daysAgo = ((numericId - 1000) % 180) + 1
  const receivedDate = new Date(now)
  receivedDate.setDate(receivedDate.getDate() - daysAgo)
  receivedDate.setHours(Math.floor(Math.random() * 24))
  receivedDate.setMinutes(Math.floor(Math.random() * 60))

  const type = types[numericId % types.length]
  const status = statuses[numericId % statuses.length]

  // Mensajes iniciales según tipo
  const quejasIniciales = [
    "Buenos días, el día de ayer tuve un problema con la entrega en la colonia El Roble. El cliente reportó que el paquete llegó con un golpe en la caja y me están culpando a mí, pero cuando lo recogí en el almacén ya venía así. Necesito que revisen las cámaras del almacén para que se vea que no fue mi responsabilidad. Esto puede afectar mi calificación y no es justo.",
    "Quiero reportar que el sistema de rutas me mandó por una calle que está cerrada por construcción desde hace dos semanas. Perdí 40 minutos buscando una ruta alterna y llegué tarde a 3 entregas. Los clientes se quejaron y ahora tengo penalizaciones por demora. El sistema debería actualizarse con estas situaciones.",
    "Tengo una queja formal sobre el coordinador de turno matutino. Me habló de manera grosera frente a otros compañeros cuando llegué 5 minutos tarde por un choque en la carretera que me detuvo. No es la primera vez que tiene actitudes así. Me gustaría que se tome acción al respecto.",
    "El vehículo que me asignaron tiene problemas con el aire acondicionado y hace mucho calor. Ya lo reporté hace dos semanas pero no me han dado solución. Trabajar 8 horas con este calor es insoportable y afecta mi salud. Necesito que esto se resuelva ya.",
  ]

  const aclaracionesIniciales = [
    "Buenas tardes, me gustaría aclarar la situación del reporte del día 15 donde aparece que no completé mi ruta. Lo que sucedió es que el sistema se cayó durante 2 horas y no pude marcar las entregas como completadas. Tengo los comprobantes firmados por los clientes. ¿Podrían actualizar mi registro?",
    "Necesito aclaración sobre mi pago de la quincena pasada. Según mis cálculos debería haber recibido $8,450 pero solo me llegaron $7,980. ¿Me pueden explicar cuál fue el descuento o si hubo algún error?",
    "Hola, tengo una duda sobre las nuevas políticas de entregas que enviaron por correo. ¿Los clientes ahora tienen que firmar digitalmente o todavía se acepta firma en papel? En mi zona muchos clientes no tienen smartphone y necesito saber cómo proceder.",
    "Quiero aclarar que el reporte de queja del cliente del día 18 no es válido. Tengo foto con timestamp que muestra que entregué el paquete a las 2:15 PM tal como se acordó, pero el cliente dice que llegué tarde. Adjunto la evidencia.",
  ]

  const comentariosIniciales = [
    "Hola equipo, solo quería comentar que el nuevo sistema de tracking en tiempo real está funcionando muy bien. Los clientes están contentos porque pueden ver cuándo voy a llegar y eso ha reducido las quejas. ¡Buen trabajo!",
    "Me gustaría sugerir que se instalen más casilleros de seguridad en las zonas residenciales. Muchos clientes no están en casa y podríamos dejar los paquetes ahí de forma segura. Sería más eficiente para todos.",
    "Quiero agradecer al equipo de soporte por resolver rápido el problema que tuve con la app la semana pasada. La atención fue excelente y pude completar mis entregas sin problema.",
    "Comentario: Sería útil tener un grupo de WhatsApp o canal de comunicación rápido entre drivers de la misma zona. Así podríamos avisarnos de calles cerradas, tráfico o situaciones que nos afectan a todos.",
  ]

  let initialMessage = ""
  if (type === "Queja") {
    initialMessage = quejasIniciales[(numericId - 1000) % quejasIniciales.length]
  } else if (type === "Aclaración") {
    initialMessage = aclaracionesIniciales[(numericId - 1000) % aclaracionesIniciales.length]
  } else {
    initialMessage = comentariosIniciales[(numericId - 1000) % comentariosIniciales.length]
  }

  // Generar mensajes de conversación según el estado
  const messages: ComplaintMessage[] = []

  if (status === "En proceso" || status === "Resuelta") {
    // Al menos un mensaje de soporte
    const supportDate1 = new Date(receivedDate)
    supportDate1.setHours(supportDate1.getHours() + 2)
    
    messages.push({
      id: `msg-${id}-1`,
      author: "Soporte",
      sentAt: supportDate1.toISOString(),
      text: "Hola, hemos recibido tu reporte y lo estamos revisando. Te mantendremos informado de los avances. Gracias por tu paciencia."
    })

    // Si está en proceso, agregar más mensajes
    if (status === "En proceso") {
      const driverDate2 = new Date(supportDate1)
      driverDate2.setDate(driverDate2.getDate() + 1)
      
      messages.push({
        id: `msg-${id}-2`,
        author: "Driver",
        sentAt: driverDate2.toISOString(),
        text: "Gracias por la respuesta. ¿Ya tienen un estimado de cuándo se podrá resolver esto?"
      })

      const supportDate3 = new Date(driverDate2)
      supportDate3.setHours(supportDate3.getHours() + 4)
      
      messages.push({
        id: `msg-${id}-3`,
        author: "Soporte",
        sentAt: supportDate3.toISOString(),
        text: "Estamos coordinando con el área correspondiente. Esperamos tener una respuesta definitiva en las próximas 24-48 horas."
      })
    }

    // Si está resuelta, agregar mensaje de cierre
    if (status === "Resuelta") {
      const supportDateFinal = new Date(supportDate1)
      supportDateFinal.setDate(supportDateFinal.getDate() + 2)
      
      messages.push({
        id: `msg-${id}-final`,
        author: "Soporte",
        sentAt: supportDateFinal.toISOString(),
        text: "Hemos revisado tu caso y tomado las acciones necesarias. El problema ha sido resuelto. Si tienes alguna duda adicional, no dudes en contactarnos. ¡Gracias por tu reporte!"
      })
    }
  }

  return {
    id,
    type,
    receivedAt: receivedDate.toISOString(),
    status,
    driver: {
      id: driverId,
      name: nombre,
      rfc: rfc,
      phone: `+52 ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10000) + 1000} ${Math.floor(Math.random() * 10000) + 1000}`,
      email: `${nombre.toLowerCase().replace(/\s+/g, '.')}@email.com`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    },
    initialMessage,
    messages
  }
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

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<ComplaintDetail | null>(null)
  const [replyText, setReplyText] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  
  // Estados de adjuntos
  const [attachments, setAttachments] = useState<File[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [securityBlocked, setSecurityBlocked] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  
  // Estado del modal de confirmación de cierre
  const [showResolveModal, setShowResolveModal] = useState(false)
  
  // Toggle para pruebas de seguridad (dummy)
  const [simulateSecurityBlock, setSimulateSecurityBlock] = useState(false)

  const MAX_CHARS = 5000
  const MAX_ATTACHMENTS = 3
  const MAX_FILE_SIZE = 2.5 * 1024 * 1024 // 2.5 MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  // Cargar datos
  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300))
      
      const data = generateComplaintDetail(id)
      setDetail(data)
      setLoading(false)
    }

    loadDetail()
  }, [id])

  // Truncar texto si excede el límite
  useEffect(() => {
    if (replyText.length > MAX_CHARS) {
      setReplyText(replyText.substring(0, MAX_CHARS))
    }
  }, [replyText])

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Calcular cuántos archivos más podemos agregar
    const availableSlots = MAX_ATTACHMENTS - attachments.length
    
    if (availableSlots <= 0) {
      showToastMessage("Máximo 3 archivos por mensaje.")
      event.target.value = ""
      return
    }
    
    // Si intentan seleccionar más de los permitidos, mostrar mensaje
    if (files.length > availableSlots) {
      showToastMessage(`Solo puedes agregar ${availableSlots} archivo${availableSlots > 1 ? 's' : ''} más. Máximo 3 por mensaje.`)
    }
    
    // Tomar solo los primeros archivos hasta completar el límite
    const filesToProcess = files.slice(0, availableSlots)
    const validFiles: File[] = []
    
    for (const file of filesToProcess) {
      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToastMessage(`"${file.name}" no es un formato permitido. Solo PDF, JPG, PNG o WEBP.`)
        continue
      }

      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        showToastMessage(`"${file.name}" excede 2.5MB.`)
        continue
      }

      validFiles.push(file)
    }
    
    // Agregar solo los archivos válidos
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles])
    }

    // Limpiar input
    event.target.value = ""
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />
    return <ImageIcon className="h-4 w-4" />
  }

  const handleSendMessage = async () => {
    if (!detail || replyText.trim() === "") return

    const statusBefore = detail.status
    setSecurityBlocked(false)

    // Si hay adjuntos, simular escaneo de seguridad
    if (attachments.length > 0) {
      setIsScanning(true)
      
      // Simular escaneo 1-2 segundos
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
      
      // Verificar resultado de seguridad (dummy)
      if (simulateSecurityBlock) {
        setIsScanning(false)
        setSecurityBlocked(true)
        showToastMessage("Problema de seguridad detectado")
        return
      }
      
      setIsScanning(false)
    }

    // Crear adjuntos dummy
    const messageAttachments: MessageAttachment[] = attachments.map((file, index) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
      return {
        id: `attach-${detail.id}-${Date.now()}-${index}`,
        name: file.name,
        type: extension as AttachmentType,
        size: file.size,
        url: URL.createObjectURL(file) // URL temporal para preview
      }
    })

    const newMessage: ComplaintMessage = {
      id: `msg-${detail.id}-${detail.messages.length + 1}`,
      author: "Soporte",
      sentAt: new Date().toISOString(),
      text: replyText.trim(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined
    }

    // Determinar nuevo estado
    const newStatus: ComplaintStatus = detail.status === "Resuelta" 
      ? "En proceso" 
      : (detail.status === "Nueva" ? "En proceso" : detail.status)

    // Actualizar estado
    const updatedDetail = {
      ...detail,
      messages: [...detail.messages, newMessage],
      status: newStatus
    }

    setDetail(updatedDetail)
    setReplyText("")
    setAttachments([])
    setSecurityBlocked(false)

    // Log de auditoría (console)
    console.log('🔔 AUDIT LOG - COMPLAINT_MESSAGE_SENT', {
      action: 'COMPLAINT_MESSAGE_SENT',
      complaintId: detail.id,
      sentBy: 'admin@demo.com', // Usuario dummy
      sentAt: new Date().toISOString(),
      complaintStatusBefore: statusBefore,
      complaintStatusAfter: newStatus,
      attachmentsCount: messageAttachments.length,
      attachmentsTypes: messageAttachments.map(a => a.type),
      messageLength: replyText.trim().length
    })

    // Notificaciones
    if (statusBefore === "Resuelta" && newStatus === "En proceso") {
      showToastMessage("El caso fue reabierto al enviar un nuevo mensaje.")
    } else {
      showToastMessage("Mensaje enviado correctamente")
    }
  }

  const handleMarkAsResolvedClick = () => {
    // Mostrar modal de confirmación
    setShowResolveModal(true)
  }

  const handleConfirmResolve = () => {
    if (!detail) return

    const statusBefore = detail.status
    const updatedDetail = {
      ...detail,
      status: "Resuelta" as ComplaintStatus
    }

    setDetail(updatedDetail)
    setShowResolveModal(false)

    // Log de auditoría
    console.log('🔔 AUDIT LOG - COMPLAINT_STATUS_CHANGE', {
      action: 'COMPLAINT_STATUS_CHANGE',
      complaintId: detail.id,
      from: statusBefore,
      to: 'Resuelta',
      changedBy: 'admin@demo.com', // Usuario dummy
      changedAt: new Date().toISOString()
    })

    showToastMessage("Caso marcado como resuelto.")
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessageDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hoy a las ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Ayer a las ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <RoleGuard moduleKey={moduleKey} checkModuleAccessUseCase={checkModuleAccessUseCase}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  // Not found state
  if (!detail) {
    return (
      <RoleGuard moduleKey={moduleKey} checkModuleAccessUseCase={checkModuleAccessUseCase}>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push('/adm/complaints')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró el registro solicitado. El ID "{id}" no existe.
            </AlertDescription>
          </Alert>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard moduleKey={moduleKey} checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6">
        {/* Toast */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/adm/complaints">Quejas y Aclaraciones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detalle</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/adm/complaints')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Banner de caso cerrado */}
        {detail.status === "Resuelta" && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Este caso se encuentra cerrado.
            </AlertDescription>
          </Alert>
        )}

        {/* Encabezado principal */}
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-2xl">{detail.id}</CardTitle>
                  <Badge variant={getTypeBadgeVariant(detail.type)}>{detail.type}</Badge>
                  <Badge variant={getStatusBadgeVariant(detail.status)}>{detail.status}</Badge>
                </div>
                <CardDescription>
                  Recibido el {formatDate(detail.receivedAt)}
                </CardDescription>
              </div>
              <Button
                onClick={handleMarkAsResolvedClick}
                disabled={detail.status === "Resuelta"}
                className="w-full md:w-auto"
                title={detail.status === "Resuelta" ? "Este caso ya se encuentra cerrado." : "Marcar caso como resuelto"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar como resuelto
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Información del Driver */}
            <div className="border rounded-lg p-4 bg-muted/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Driver
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  <Link 
                    href={`/drivers/${detail.driver.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {detail.driver.name}
                  </Link>
                </div>
                <div>
                  <span className="text-muted-foreground">RFC:</span>{" "}
                  <span className="font-medium">{detail.driver.rfc}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>{" "}
                  <span className="font-medium">{detail.driver.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Correo:</span>{" "}
                  <span className="font-medium">{detail.driver.email}</span>
                </div>
              </div>
            </div>

            {/* Mensaje inicial */}
            <div>
              <h3 className="font-semibold mb-3">Mensaje inicial</h3>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {detail.initialMessage}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Conversación */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversación ({detail.messages.length} {detail.messages.length === 1 ? 'mensaje' : 'mensajes'})
            </CardTitle>
            <CardDescription>
              Historial de mensajes ordenados de más antiguo a más reciente
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {detail.messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay mensajes en esta conversación aún.</p>
                <p className="text-sm mt-1">Escribe tu respuesta abajo para iniciar la conversación.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {detail.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === "Soporte" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.author === "Soporte"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {message.author}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatMessageDate(message.sentAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {message.text}
                      </p>

                      {/* Adjuntos */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={`flex items-center gap-2 p-2 rounded ${
                                message.author === "Soporte"
                                  ? "bg-primary-foreground/10"
                                  : "bg-background/50"
                              }`}
                            >
                              {attachment.type === 'pdf' ? (
                                <>
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                                    <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div 
                                    className="w-12 h-12 rounded overflow-hidden cursor-pointer flex-shrink-0"
                                    onClick={() => {
                                      setSelectedImage(attachment.url)
                                      setShowImageModal(true)
                                    }}
                                  >
                                    <img 
                                      src={attachment.url} 
                                      alt={attachment.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                                    <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setSelectedImage(attachment.url)
                                      setShowImageModal(true)
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campo de respuesta */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-lg">Responder</CardTitle>
                {detail.status === "Resuelta" && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este caso ya está marcado como resuelto, pero aún puedes agregar mensajes si es necesario.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Toggle para pruebas de seguridad (visible solo en dev) */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant={simulateSecurityBlock ? "destructive" : "outline"}
                  onClick={() => setSimulateSecurityBlock(!simulateSecurityBlock)}
                  className="text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {simulateSecurityBlock ? "Bloqueo ON" : "Bloqueo OFF"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Área de texto */}
            <div className="space-y-2">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                className="resize-none"
                disabled={isScanning}
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={`${replyText.length >= MAX_CHARS ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  {replyText.length} / {MAX_CHARS} caracteres
                </span>
                {replyText.length >= MAX_CHARS && (
                  <span className="text-destructive font-medium">
                    ⚠ Se ha llegado al límite de texto permitido.
                  </span>
                )}
              </div>
            </div>

            {/* Adjuntos seleccionados */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Archivos adjuntos ({attachments.length}/{MAX_ATTACHMENTS})</label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAttachment(index)}
                        className="h-8 w-8 p-0"
                        disabled={isScanning}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerta de bloqueo de seguridad */}
            {securityBlocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se detectaron uno o varios problemas de seguridad con la información adjunta, por favor revisa e intenta de nuevo.
                </AlertDescription>
              </Alert>
            )}

            {/* Estado de escaneo */}
            {isScanning && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription className="flex items-center gap-2">
                  <span>Analizando adjuntos...</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isScanning || attachments.length >= MAX_ATTACHMENTS}
                  aria-label="Seleccionar archivos para adjuntar"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isScanning || attachments.length >= MAX_ATTACHMENTS}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Adjuntar archivo
                  {attachments.length > 0 && ` (${attachments.length}/${MAX_ATTACHMENTS})`}
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, WEBP • Máx 2.5MB
                </span>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={replyText.trim() === "" || isScanning}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal visor de imágenes */}
        {showImageModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowImageModal(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <img
                src={selectedImage}
                alt="Vista previa"
                className="w-full h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Modal de confirmación de cierre */}
        {showResolveModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowResolveModal(false)}
          >
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Confirmar cierre de caso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm leading-relaxed">
                  ¿Estas seguro de marcar este tema como resuelto? Recuerda que una vez cerrado no es posible volver a abrirlo.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowResolveModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmResolve}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}


