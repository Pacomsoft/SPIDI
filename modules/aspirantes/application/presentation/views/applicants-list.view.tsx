'use client';

import { useState } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import type { DateRange } from 'react-day-picker';
import {
  Search, Download, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, ExternalLink, Car, FileText,
} from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import type { IGetApplicantsUseCase } from '../../../domain/contracts/get-applicants-use-case.interface';
import type { IExportApplicantsUseCase } from '../../../domain/contracts/export-applicants-use-case.interface';
import type { IGetApplicantCatalogsUseCase } from '../../../domain/contracts/get-applicant-catalogs-use-case.interface';
import type { IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import type { ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { useApplicantsList } from '../../../application/hooks/use-applicants-list.hook';
import { ApplicantStatusBadge } from '../components/applicant-status-badge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DatePickerWithRange } from '../ui/date-range-picker';
import type { IApplicantListItemDTO } from '../../../domain/contracts/applicant-list.dto';

const MODULE_KEY = 'ASPIRANTES';
const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface IApplicantsListViewProps {
  getApplicantsUseCase: IGetApplicantsUseCase;
  exportApplicantsUseCase: IExportApplicantsUseCase;
  getCatalogsUseCase: IGetApplicantCatalogsUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
}

// Mapeo de estados de negocio a clases CSS (RN02–RN05)
// Los estados internos de BD (Escaneado, Eliminado) ya fueron normalizados a 'Pendiente' en el SP
const DOC_STATUS_COLOR_MAP: Record<string, string> = {
  'Pendiente':   'dot-pendiente',
  'No legible':  'dot-no-legible',
  'Prevalidado': 'dot-prevalidado',
  'Validado':    'dot-validado',
};

const DOC_STATUS_LABEL_MAP: Record<string, string> = {
  'Pendiente':   'Pendiente',
  'No legible':  'No legible',
  'Prevalidado': 'Prevalidado',
  'Validado':    'Validado',
};

function DocumentDots({ documents }: { documents?: IApplicantListItemDTO['documents'] }) {
  if (!documents?.length) return <span className="text-xs text-muted-foreground">—</span>;
  const validated = documents.filter((d) => d.status === 'Validado').length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {documents.map((doc, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${DOC_STATUS_COLOR_MAP[doc.status] ?? 'dot-pendiente'}`}
            title={`${doc.name}: ${DOC_STATUS_LABEL_MAP[doc.status] ?? doc.status}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{validated}/{documents.length}</span>
    </div>
  );
}

export function ApplicantListView({
  getApplicantsUseCase,
  exportApplicantsUseCase,
  getCatalogsUseCase,
}: IApplicantsListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<IApplicantListItemDTO | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const {
    items, total, totalPages, isLoading, filters, searchInput,
    locations, handleSearchChange, handleFilterChange,
    handlePageChange, handlePageSizeChange, handleSortChange, handleExport,
  } = useApplicantsList(getApplicantsUseCase, exportApplicantsUseCase, getCatalogsUseCase);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    handleFilterChange('dateFrom', range?.from?.toISOString() ?? '');
    handleFilterChange('dateTo', range?.to?.toISOString() ?? '');
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (filters.sortBy !== col) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return filters.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <RoleGuard moduleKey={MODULE_KEY} checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Listado de aspirantes</h1>
                <p className="text-sm text-muted-foreground mt-1">{total} aspirantes</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, teléfono o email..."
                      value={searchInput}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select onValueChange={(v) => handleExport(v)}>
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
                      <label className="text-xs font-medium text-muted-foreground">Estado de aspirante</label>
                      <Tabs value={filters.applicationStatus || 'activos'} onValueChange={(v) => handleFilterChange('applicationStatus', v === 'activos' || v === 'todos' ? '' : v)}>
                      <TabsList className="h-9 w-max lg:w-auto inline-flex">
                        <TabsTrigger value="activos" className="text-xs whitespace-nowrap">Activos</TabsTrigger>
                        <TabsTrigger value="todos" className="text-xs whitespace-nowrap">Todos</TabsTrigger>
                        <TabsTrigger value="Pending" className="text-xs whitespace-nowrap">Pendiente</TabsTrigger>
                        <TabsTrigger value="In Review" className="text-xs whitespace-nowrap">Revisión</TabsTrigger>
                        <TabsTrigger value="Proposal Sent" className="text-xs whitespace-nowrap">Propuesta</TabsTrigger>
                        <TabsTrigger value="Approved" className="text-xs whitespace-nowrap">Aprobado</TabsTrigger>
                        <TabsTrigger value="Rejected" className="text-xs whitespace-nowrap">Rechazado</TabsTrigger>
                      </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:w-auto">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Documentación</label>
                      <Select value={filters.documentationStatus || 'todos'} onValueChange={(v) => handleFilterChange('documentationStatus', v === 'todos' ? '' : v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Estado docs" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los estados</SelectItem>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="No legible">No legible</SelectItem>
                          <SelectItem value="Prevalidado">Prevalidado</SelectItem>
                          <SelectItem value="Validado">Validado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Ubicación</label>
                      <Select value={filters.location || 'todos'} onValueChange={(v) => handleFilterChange('location', v === 'todos' ? '' : v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Ubicación" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas las ubicaciones</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Fecha de registro</label>
                      <DatePickerWithRange date={dateRange} onDateChange={handleDateRangeChange} placeholder="Filtrar fecha" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Nombre</TableHead>
                    <TableHead className="whitespace-nowrap">Teléfono</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 whitespace-nowrap" onClick={() => handleSortChange('location')}>
                      <div className="flex items-center">Ubicación<SortIcon col="location" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 whitespace-nowrap" onClick={() => handleSortChange('registrationDate')}>
                      <div className="flex items-center">Fecha<SortIcon col="registrationDate" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 whitespace-nowrap" onClick={() => handleSortChange('applicationStatus')}>
                      <div className="flex items-center">Estado Aplicación<SortIcon col="applicationStatus" /></div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Estado Documentación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No se encontraron aspirantes con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => { setSelected(item); setDrawerOpen(true); }}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {item.firstName} {item.paternalLastName} {item.maternalLastName}
                        </TableCell>
                        <TableCell>{item.phone}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.location}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(item.registrationDate).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell><ApplicantStatusBadge status={item.applicationStatus} /></TableCell>
                        <TableCell><DocumentDots documents={item.documents} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 sm:px-0">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="text-xs sm:text-sm text-muted-foreground">Mostrar</span>
                <Select value={String(filters.pageSize)} onValueChange={(v) => handlePageSizeChange(Number(v))}>
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-muted-foreground">de {total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.max(1, filters.page - 1))} disabled={filters.page === 1} className="h-8">
                  <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{filters.page} / {totalPages || 1}</span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.min(totalPages, filters.page + 1))} disabled={filters.page >= totalPages} className="h-8">
                  <span className="hidden sm:inline mr-1">Siguiente</span><ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Resumen - {selected?.id}</SheetTitle>
              <SheetDescription>Vista rápida del aspirante</SheetDescription>
            </SheetHeader>
            {selected && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Nombre', `${selected.firstName} ${selected.paternalLastName} ${selected.maternalLastName}`],
                      ['Teléfono', selected.phone],
                      ['Email', selected.email],
                      ['Ubicación', selected.location],
                      ['Fecha registro', new Date(selected.registrationDate).toLocaleDateString('es-MX')],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-medium text-xs text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Estado</h3>
                  <ApplicantStatusBadge status={selected.applicationStatus} />
                </div>
                {selected.vehicle && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Car className="h-5 w-5" />Vehículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        ['Marca', selected.vehicle.make], ['Modelo', selected.vehicle.model],
                        ['Año', String(selected.vehicle.year)], ['Color', selected.vehicle.color],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.documents && selected.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />Documentación
                    </h3>
                    <div className="space-y-2">
                      {selected.documents.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{doc.name}</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${DOC_STATUS_COLOR_MAP[doc.status] ?? 'dot-pendiente'}`} />
                              <span className="text-xs text-muted-foreground">{DOC_STATUS_LABEL_MAP[doc.status] ?? doc.status}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notas</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{selected.notes}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={() => { setDrawerOpen(false); navigateTo(`/adm/aspirantes/${selected.id}`); }}>
                    <ExternalLink className="mr-2 h-4 w-4" />Ver detalle completo
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </RoleGuard>
  );
}
