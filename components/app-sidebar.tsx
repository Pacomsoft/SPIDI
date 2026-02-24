"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { authProvider } from "@/lib/auth"
import { getAllowedModules, type ModuleKey, type Role } from "@/lib/roles"
import {
  Users,
  Car,
  CreditCard,
  MessageSquare,
  GraduationCap,
  FileText,
  LogOut,
  User,
  MoreVertical,
  ChevronRight,
  MessageCircle,
} from "lucide-react"
import * as Collapsible from "@radix-ui/react-collapsible"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Opciones del menú del sistema
const menuItems = [
  {
    title: "Aspirantes",
    icon: Users,
    url: "/aspirantes",
    moduleKey: "ASPIRANTES" as ModuleKey,
  },
  {
    title: "Drivers",
    icon: Car,
    url: "/drivers",
    moduleKey: "DRIVERS" as ModuleKey,
  },
  {
    title: "Pagos",
    icon: CreditCard,
    url: "/pagos",
    moduleKey: "PAGOS" as ModuleKey,
  },
  {
    title: "Comunicación",
    icon: MessageSquare,
    url: "/comunicacion",
    moduleKey: "COMUNICACION" as ModuleKey,
  },
  {
    title: "Capacitación",
    icon: GraduationCap,
    url: "/capacitacion",
    moduleKey: "CAPACITACION" as ModuleKey,
  },
  {
    title: "Contratos",
    icon: FileText,
    url: "/contratos",
    moduleKey: "CONTRATOS" as ModuleKey,
  },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = React.useState<{
    userName: string
    userRole: string
    role: Role
  } | null>(null)
  const [comunicacionOpen, setComunicacionOpen] = React.useState(false)

  React.useEffect(() => {
    const currentSession = authProvider.getSession()
    if (currentSession) {
      setSession({
        userName: currentSession.userName,
        userRole: currentSession.userRole,
        role: currentSession.role,
      })
    }
  }, [])

  // Auto-expandir Comunicación si la ruta actual está dentro de sus subitems
  React.useEffect(() => {
    if (pathname?.startsWith('/complaints')) {
      setComunicacionOpen(true)
    }
  }, [pathname])

  // Filtrar menuItems basándose en el rol del usuario
  const allowedModules = session?.role ? getAllowedModules(session.role) : []
  const filteredMenuItems = menuItems.filter((item) =>
    allowedModules.includes(item.moduleKey)
  )

  const handleLogout = () => {
    authProvider.logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header del Sidebar */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SPIDI</span>
                <span className="truncate text-xs">Sistema Administrativo</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenido del Sidebar - Menú */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                // Comunicación tiene submenu
                if (item.moduleKey === "COMUNICACION") {
                  const isActive = pathname === item.url || pathname?.startsWith('/complaints')
                  return (
                    <Collapsible.Root
                      key={item.title}
                      open={comunicacionOpen}
                      onOpenChange={setComunicacionOpen}
                      asChild
                    >
                      <SidebarMenuItem>
                        <Collapsible.Trigger asChild>
                          <SidebarMenuButton 
                            tooltip={item.title}
                            isActive={isActive}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${comunicacionOpen ? 'rotate-90' : ''}`} />
                          </SidebarMenuButton>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton 
                                asChild
                                isActive={pathname === '/complaints'}
                              >
                                <a href="/complaints">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>Listado de quejas</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </Collapsible.Content>
                      </SidebarMenuItem>
                    </Collapsible.Root>
                  )
                }

                // Items normales sin submenu
                const isActive = pathname === item.url || pathname?.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer del Sidebar - Usuario */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground !h-auto min-h-12 !items-start py-2 !w-full"
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src="" alt={session?.userName || "Usuario"} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {session?.userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left text-sm leading-tight overflow-hidden">
                    <div className="truncate font-semibold">
                      {session?.userName || "Usuario"}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                      {session?.userRole || "Rol"}
                    </div>
                  </div>
                  <MoreVertical className="size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src="" alt={session?.userName || "Usuario"} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {session?.userName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left text-sm leading-tight overflow-hidden">
                      <div className="truncate font-semibold">
                        {session?.userName || "Usuario"}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                        {session?.userRole || "Rol"}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
