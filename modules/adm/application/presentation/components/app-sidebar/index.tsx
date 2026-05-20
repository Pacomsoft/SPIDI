'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Icon } from '@/components/ui/icon';
import { SpidiLogo } from '@/components/ui/spidi-logo';
import { useSidebar } from '@/components/ui/sidebar';
import { useModuleAccessContext } from '@/modules/adm/application/presentation/components/guard-page/module-access.context';
import { type IAdmSessionPort } from '@/modules/adm/domain/contracts/adm-session-port.interface';
import { useConfirmDialog } from '@/modules/shared/application/hooks/use-confirm-dialog.hook';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';

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
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { handleNavClick } = useNavigationLoading();
  const { state: sidebarState, setOpen } = useSidebar();
  const [comunicacionOpen, setComunicacionOpen] = React.useState(false);
  const [pagosOpen, setPagosOpen] = React.useState(false);
  const [driversOpen, setDriversOpen] = React.useState(false);

  const isCollapsed = sidebarState === 'collapsed';

  // Si el sidebar está colapsado, primero lo expande y luego abre el collapsible
  const handleCollapsibleTrigger = (
    currentOpen: boolean,
    setOpen_: (v: boolean) => void,
  ) => {
    if (isCollapsed) {
      setOpen(true);
      setOpen_(true);
    } else {
      setOpen_(!currentOpen);
    }
  };

  const { sessionInfo, isLoading, allowedModules } = useModuleAccessContext();

  React.useEffect(() => {
    if (pathname?.startsWith('/adm/complaints')) {
      setComunicacionOpen(true);
    }
  }, [pathname]);

  React.useEffect(() => {
    if (pathname?.startsWith('/adm/pagos')) {
      setPagosOpen(true);
    }
  }, [pathname]);

  React.useEffect(() => {
    if (pathname?.startsWith('/adm/drivers')) {
      setDriversOpen(true);
    }
  }, [pathname]);

  const normalize = (url: string) => url.split('?')[0].replace(/\/$/, '');
  const isSubActive = (url: string) => {
    const current = normalize(pathname ?? '');
    const target = normalize(url);
    return current === target || current.startsWith(target + '/');
  };

  // Todos los módulos con permiso de vista (sin filtrar displayMenu)
  // necesarios para calcular sub-items de secciones collapsibles
  const allAllowedModules = isLoading ? [] : allowedModules;

  // Sub-items de secciones collapsibles: se calculan sobre TODOS los módulos
  // con permiso (independientemente de displayMenu), porque displayMenu=false
  // en un sub-módulo significa "no mostrar como ítem raíz", no "ocultar del sub-menú"
  const pagosSubItems = allAllowedModules.filter((item) =>
    item.moduleKey.startsWith('PAGOS_'),
  );
  const driversSubItems = allAllowedModules.filter((item) =>
    item.moduleKey.startsWith('DRIVERS_'),
  );

  // Ítems de nivel raíz: solo los que tienen displayMenu=true y no son sub-items collapsibles
  const filteredMenuItems = allAllowedModules.filter((item) => item.visible);
  const topLevelItems = filteredMenuItems.filter(
    (item) => !item.moduleKey.startsWith('PAGOS_') && !item.moduleKey.startsWith('DRIVERS_'),
  );

  const handleLogout = async () => {
    const confirmed = await confirm({ text: '¿Estás seguro que deseas cerrar sesión?' });
    if (!confirmed) return;
    await sessionPort.logout();
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
              {topLevelItems.map((item) => {
                if (item.moduleKey === 'PAGOS' && pagosSubItems.length === 0) {
                  // PAGOS sin sub-módulos → renderizar como ítem directo
                  const isActive =
                    pathname === item.url || pathname?.startsWith(item.url + '/');
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-auto [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-hidden [&>span:last-child]:break-words">
                        <Link href={item.url} onClick={() => handleNavClick(item.url)}>
                          <Icon name={item.icon} className="h-5 w-5 shrink-0 spidi-sidebar-icon" />
                          <span className="min-w-0 break-words">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (item.moduleKey === 'PAGOS' && pagosSubItems.length > 0) {
                  // PAGOS con sub-módulos → se renderiza abajo como collapsible, omitir aquí
                  return null;
                }

                if (item.moduleKey === 'DRIVERS' && driversSubItems.length > 0) {
                  return (
                    <Collapsible.Root
                      key={item.moduleKey}
                      open={driversOpen}
                      onOpenChange={(v) => handleCollapsibleTrigger(driversOpen, setDriversOpen)}
                      asChild
                    >
                      <SidebarMenuItem>
                        <Collapsible.Trigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isSubActive(item.url) || driversSubItems.some(s => isSubActive(s.url))}
                            className="h-auto [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-hidden [&>span:last-child]:break-words"
                          >
                            <Icon name={item.icon} className="h-5 w-5 shrink-0 spidi-sidebar-icon" />
                            <span className="min-w-0 break-words">{item.title}</span>
                            <Icon
                              name="chevron_right"
                              className={`ml-auto h-5 w-5 transition-transform duration-200 ${driversOpen ? 'rotate-90' : ''}`}
                            />
                          </SidebarMenuButton>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem key="DRIVERS_LIST">
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive(item.url) && !driversSubItems.some(s => isSubActive(s.url))}
                              >
                                <Link href={item.url} onClick={() => handleNavClick(item.url)}>
                                  <Icon name="list" className="h-5 w-5 shrink-0" />
                                  <span className="min-w-0 break-words">Listado de drivers</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {driversSubItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.moduleKey}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive(subItem.url)}
                                >
                                  <Link href={subItem.url} onClick={() => handleNavClick(subItem.url)}>
                                    <Icon name={subItem.icon} className="h-5 w-5 shrink-0" />
                                    <span className="min-w-0 break-words">{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </Collapsible.Content>
                      </SidebarMenuItem>
                    </Collapsible.Root>
                  );
                }

                if (item.moduleKey === 'COMUNICACION') {
                  return (
                    <Collapsible.Root
                      key={item.title}
                      open={comunicacionOpen}
                      onOpenChange={(v) => handleCollapsibleTrigger(comunicacionOpen, setComunicacionOpen)}
                      asChild
                    >
                      <SidebarMenuItem>
                        <Collapsible.Trigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={isSubActive('/adm/complaints')} className="h-auto [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-hidden [&>span:last-child]:break-words">
                            <Icon name={item.icon} className="h-5 w-5 shrink-0 spidi-sidebar-icon" />
                            <span className="min-w-0 break-words">{item.title}</span>
                            <Icon
                              name="chevron_right"
                              className={`ml-auto h-5 w-5 transition-transform duration-200 ${comunicacionOpen ? 'rotate-90' : ''}`}
                            />
                          </SidebarMenuButton>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={isSubActive('/adm/complaints')}>
                               <Link href="/adm/complaints" onClick={() => handleNavClick('/adm/complaints')}>
                                  <Icon name="chat" className="h-5 w-5 shrink-0" />
                                  <span className="min-w-0 break-words">Listado de quejas</span>
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
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-auto [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-hidden [&>span:last-child]:break-words">
                      <Link href={item.url} onClick={() => handleNavClick(item.url)}>
                        <Icon name={item.icon} className="h-5 w-5 shrink-0 spidi-sidebar-icon" />
                        <span className="min-w-0 break-words">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* PAGOS collapsible — solo cuando hay sub-módulos PAGOS_* disponibles */}
              {pagosSubItems.length > 0 && (
                <Collapsible.Root
                  open={pagosOpen}
                  onOpenChange={(v) => handleCollapsibleTrigger(pagosOpen, setPagosOpen)}
                  asChild
                >
                  <SidebarMenuItem>
                    <Collapsible.Trigger asChild>
                        <SidebarMenuButton
                          tooltip="Pagos"
                          isActive={pagosSubItems.some(s => isSubActive(s.url))}
                          className="h-auto [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-hidden [&>span:last-child]:break-words"
                        >
                         <Icon name="payments" className="h-5 w-5 shrink-0 spidi-sidebar-icon" />
                         <span className="min-w-0 break-words">Pagos</span>
                        <Icon
                          name="chevron_right"
                          className={`ml-auto h-5 w-5 transition-transform duration-200 ${pagosOpen ? 'rotate-90' : ''}`}
                        />
                      </SidebarMenuButton>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <SidebarMenuSub>
                        {pagosSubItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.moduleKey}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive(subItem.url)}
                            >
                                <Link href={subItem.url} onClick={() => handleNavClick(subItem.url)}>
                                <Icon name={subItem.icon} className="h-5 w-5 shrink-0" />
                                <span className="min-w-0 break-words">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </Collapsible.Content>
                  </SidebarMenuItem>
                </Collapsible.Root>
              )}
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
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src="" alt={sessionInfo?.userName ?? 'Usuario'} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {sessionInfo?.userName?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden w-0">
                    <span className="truncate font-semibold">
                      {sessionInfo?.userName ?? 'Usuario'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sessionInfo?.userRole ?? 'Rol'}
                    </span>
                  </div>
                  <Icon name="more_vert" className="ml-auto size-4 shrink-0" />
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
                    <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden w-0">
                      <span className="truncate font-semibold">
                        {sessionInfo?.userName ?? 'Usuario'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {sessionInfo?.userRole ?? 'Rol'}
                      </span>
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
      {ConfirmDialog}
    </Sidebar>
  );
}
