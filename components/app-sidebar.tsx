"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { authProvider } from "@/lib/auth"
import { getAllowedModules, type ModuleKey, type Role } from "@/lib/roles"
import * as Collapsible from "@radix-ui/react-collapsible"
import { Icon } from "@/components/ui/icon"
import { SpidiLogo } from "@/components/ui/spidi-logo"

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
    icon: "group",
    url: "/adm/aspirantes",
    moduleKey: "ASPIRANTES" as ModuleKey,
  },
  {
    title: "Drivers",
    icon: "directions_car",
    url: "/adm/drivers",
    moduleKey: "DRIVERS" as ModuleKey,
  },
  // {
  //   title: "Pagos",
  //   icon: "payments",
  //   url: "/adm/pagos",
  //   moduleKey: "PAGOS" as ModuleKey,
  // },
  {
    title: "Comunicación",
    icon: "chat_bubble",
    url: "/adm/comunicacion",
    moduleKey: "COMUNICACION" as ModuleKey,
  },
  // {
  //   title: "Capacitación",
  //   icon: "school",
  //   url: "/adm/capacitacion",
  //   moduleKey: "CAPACITACION" as ModuleKey,
  // },
  // {
  //   title: "Contratos",
  //   icon: "description",
  //   url: "/adm/contratos",
  //   moduleKey: "CONTRATOS" as ModuleKey,
  // },
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
    if (pathname?.startsWith('/adm/complaints')) {
      setComunicacionOpen(true)
    }
  }, [pathname])

  // Filtrar menuItems basándose en el rol del usuario
  const allowedModules = session?.role ? getAllowedModules(session.role) : []
  const filteredMenuItems = menuItems.filter((item) =>
    allowedModules.includes(item.moduleKey)
  )

  const handleLogout = async () => {
    await authProvider.logout()
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
                <SpidiLogo size={20} />
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
                  const isActive = pathname === item.url || pathname?.startsWith('/adm/complaints')
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
                            <Icon name={item.icon} className="h-5 w-5" />
                            <span>{item.title}</span>
                            <Icon name="chevron_right" className={`ml-auto h-5 w-5 transition-transform duration-200 ${comunicacionOpen ? 'rotate-90' : ''}`} />
                          </SidebarMenuButton>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton 
                                asChild
                                isActive={pathname === '/adm/complaints'}
                              >
                                <a href="/adm/complaints">
                                  <Icon name="chat" className="h-5 w-5" />
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
                        <Icon name={item.icon} className="h-5 w-5" />
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
                  <Icon name="more_vert" className="size-5 shrink-0" />
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
                  <Icon name="person" className="mr-2 h-5 w-5" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <Icon name="logout" className="mr-2 h-5 w-5" />
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
