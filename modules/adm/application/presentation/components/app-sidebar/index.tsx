'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Icon } from '@/components/ui/icon';
import { SpidiLogo } from '@/components/ui/spidi-logo';
import { useModuleAccessContext } from '@/modules/adm/application/presentation/components/guard-page/module-access.context';
import { type IAdmSessionPort } from '@/modules/adm/domain/contracts/adm-session-port.interface';


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface IAppSidebarProps {
  sessionPort: IAdmSessionPort;
}

export function AppSidebar({ sessionPort }: IAppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [comunicacionOpen, setComunicacionOpen] = React.useState(false);

  const { sessionInfo, isLoading, allowedModules } = useModuleAccessContext();

  React.useEffect(() => {
    if (pathname?.startsWith('/adm/complaints')) {
      setComunicacionOpen(true);
    }
  }, [pathname]);

  const filteredMenuItems = isLoading
    ? []
    : allowedModules.filter((item) => item.visible);

  const handleLogout = async () => {
    await sessionPort.clearSession();
    router.push('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                if (item.moduleKey === 'COMUNICACION') {
                  const isActive =
                    pathname === item.url || pathname?.startsWith('/adm/complaints');
                  return (
                    <Collapsible.Root
                      key={item.title}
                      open={comunicacionOpen}
                      onOpenChange={setComunicacionOpen}
                      asChild
                    >
                      <SidebarMenuItem>
                        <Collapsible.Trigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                            <Icon name={item.icon} className="h-5 w-5 spidi-sidebar-icon" />
                            <span>{item.title}</span>
                            <Icon
                              name="chevron_right"
                              className={`ml-auto h-5 w-5 transition-transform duration-200 ${comunicacionOpen ? 'rotate-90' : ''}`}
                            />
                          </SidebarMenuButton>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === '/adm/complaints'}
                              >
                                <Link href="/adm/complaints">
                                  <Icon name="chat" className="h-5 w-5" />
                                  <span>Listado de quejas</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </Collapsible.Content>
                      </SidebarMenuItem>
                    </Collapsible.Root>
                  );
                }

                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + '/');
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <Icon name={item.icon} className="h-5 w-5 spidi-sidebar-icon" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
                    <AvatarImage src="" alt={sessionInfo?.userName ?? 'Usuario'} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {sessionInfo?.userName?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left text-sm leading-tight overflow-hidden">
                    <div className="truncate font-semibold">
                      {sessionInfo?.userName ?? 'Usuario'}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                      {sessionInfo?.userRole ?? 'Rol'}
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
                      <AvatarImage src="" alt={sessionInfo?.userName ?? 'Usuario'} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {sessionInfo?.userName?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left text-sm leading-tight overflow-hidden">
                      <div className="truncate font-semibold">
                        {sessionInfo?.userName ?? 'Usuario'}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                        {sessionInfo?.userRole ?? 'Rol'}
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <Icon name="logout" className="mr-2 h-5 w-5" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
