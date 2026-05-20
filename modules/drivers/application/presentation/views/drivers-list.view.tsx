'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { type IGetDriversUseCase } from '../../../domain/contracts/get-drivers-use-case.interface';
import { type IExportDriversUseCase } from '../../../domain/contracts/export-drivers-use-case.interface';
import { type IGetDriverCatalogsUseCase } from '../../../domain/contracts/get-driver-catalogs-use-case.interface';
import { useDriversList } from '../../hooks/use-drivers-list.hook';
import { DriverStatusBadge } from '../components/driver-status-badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface IDriversListViewProps {
  getDriversUseCase: IGetDriversUseCase;
  exportDriversUseCase: IExportDriversUseCase;
  getCatalogsUseCase: IGetDriverCatalogsUseCase;
}

type SortKey = 'firstName' | 'curp' | 'email' | 'phone' | 'stateOfCountry' | 'driverStatus' | 'lastOrderStore' | 'lastOrderDate';

export function DriverListView({ getDriversUseCase, exportDriversUseCase, getCatalogsUseCase }: IDriversListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const {
    drivers, total, isLoading, page, pageSize, sortBy, sortDirection,
    search, driverStatusFilter, stateFilter, storeFilter,
    states, stores,
    setPage, setPageSize, setSortBy, setSortDirection,
    setSearch, setDriverStatusFilter, setStateFilter, setStoreFilter,
    handleExport, clearFilters,
  } = useDriversList(getDriversUseCase, exportDriversUseCase, getCatalogsUseCase);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('lastOrderDate'); setSortDirection('desc'); }
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const toggleStatus = (status: string) => {
    setDriverStatusFilter(
      driverStatusFilter.includes(status)
        ? driverStatusFilter.filter(s => s !== status)
        : [...driverStatusFilter, status]
    );
  };

  const STATUS_OPTIONS = [
    { value: 'Enabled', label: 'Habilitado' },
    { value: 'Disabled', label: 'Deshabilitado' },
    { value: 'Suspended', label: 'Suspendido' },
  ];

  return (
    <RoleGuard moduleKey="DRIVERS" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Listado de Drivers</h1>
                <p className="text-sm text-muted-foreground mt-1">{total} drivers en total</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Buscar por nombre, CURP, correo o teléfono..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select onValueChange={value => { void handleExport(value); }}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Download className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Exportar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="lg:flex-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Estado de driver</label>
                      <Tabs
                        value={driverStatusFilter[0] || 'todos'}
                        onValueChange={(v) => setDriverStatusFilter(v === 'todos' ? [] : [v])}
                      >
                      <TabsList className="h-9 w-max lg:w-auto inline-flex">
                        <TabsTrigger value="todos" className="text-xs whitespace-nowrap">Todos</TabsTrigger>
                        <TabsTrigger value="Enabled" className="text-xs whitespace-nowrap">Habilitado</TabsTrigger>
                        <TabsTrigger value="Disabled" className="text-xs whitespace-nowrap">Deshabilitado</TabsTrigger>
                        <TabsTrigger value="Suspended" className="text-xs whitespace-nowrap">Suspendido</TabsTrigger>
                      </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:w-auto">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Estado donde opera</label>
                      <Select value={stateFilter || 'all'} onValueChange={v => setStateFilter(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          {states.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tienda último pedido</label>
                      <Select value={storeFilter || 'all'} onValueChange={v => setStoreFilter(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Todas las tiendas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las tiendas</SelectItem>
                          {stores.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No se encontraron drivers con los filtros seleccionados</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('firstName')}>
                          <div className="flex items-center">Nombre Completo{getSortIcon('firstName')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('curp')}>
                          <div className="flex items-center">CURP{getSortIcon('curp')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('email')}>
                          <div className="flex items-center">Correo Electrónico{getSortIcon('email')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('phone')}>
                          <div className="flex items-center">Teléfono{getSortIcon('phone')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('stateOfCountry')}>
                          <div className="flex items-center">Estado{getSortIcon('stateOfCountry')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('driverStatus')}>
                          <div className="flex items-center">Estado Driver{getSortIcon('driverStatus')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('lastOrderStore')}>
                          <div className="flex items-center">Tienda{getSortIcon('lastOrderStore')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('lastOrderDate')}>
                          <div className="flex items-center">Fecha Último Pedido{getSortIcon('lastOrderDate')}</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map(driver => (
                        <TableRow
                          key={driver.id}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => navigateTo(`/adm/drivers/${driver.id}`)}
                        >
                          <TableCell className="font-medium">{driver.firstName} {driver.paternalLastName} {driver.maternalLastName}</TableCell>
                          <TableCell className="font-mono text-xs">{driver.curp}</TableCell>
                          <TableCell className="text-sm">{driver.email}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.stateOfCountry}</TableCell>
                          <TableCell><DriverStatusBadge status={driver.driverStatus} /></TableCell>
                          <TableCell>{driver.lastOrderStore}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(driver.lastOrderDate).toLocaleDateString('es-MX')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mostrar:</span>
                      <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Página {page} de {totalPages} · Total: {total} drivers
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                      Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
