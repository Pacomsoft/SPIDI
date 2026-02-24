"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppTopbarProps {
  breadcrumbs?: {
    label: string
    href?: string
  }[]
}

const routeLabels: Record<string, string> = {
  "/home": "Inicio",
  "/aspirantes": "Aspirantes",
  "/drivers": "Drivers",
  "/capacitacion": "Capacitación",
  "/comunicacion": "Comunicación",
  "/contratos": "Contratos",
  "/pagos": "Pagos",
}

export function AppTopbar({ breadcrumbs }: AppTopbarProps) {
  const pathname = usePathname()
  
  // Generar breadcrumbs dinámicos si no se proporcionan
  const dynamicBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs
    
    const segments = pathname.split("/").filter(Boolean)
    const crumbs: { label: string; href?: string }[] = [{ label: "Inicio", href: "/home" }]
    
    segments.forEach((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`
      
      // Detectar si el segmento es un ID (UUID o número)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                   /^\d+$/.test(segment)
      
      let label: string
      if (isId) {
        label = "Detalle"
      } else {
        label = routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
      }
      
      if (index === segments.length - 1) {
        crumbs.push({ label })
      } else {
        crumbs.push({ label, href: path })
      }
    })
    
    return crumbs
  }, [pathname, breadcrumbs])
  const [notifications] = React.useState([
    { id: 1, title: "Nuevo aspirante registrado", time: "Hace 5 min", read: false },
    { id: 2, title: "Driver completó capacitación", time: "Hace 1 hora", read: false },
    { id: 3, title: "Pago procesado exitosamente", time: "Hace 2 horas", read: true },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 transition-[width,height] ease-linear">
      {/* Botón del menú lateral */}
      <SidebarTrigger className="-ml-1" />
      
      {/* Separador */}
      <Separator orientation="vertical" className="h-6" />
      
      {/* Breadcrumb */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {dynamicBreadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Notificaciones */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {unreadCount} nuevas
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`flex flex-col items-start gap-1 ${!notification.read ? 'bg-accent/50' : ''}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium">{notification.title}</span>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{notification.time}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer">
            Ver todas las notificaciones
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
