'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import {
  Download, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle,
  Clock, ExternalLink, Car, Phone, Mail, MapPin, Store, CalendarCheck, Loader2,
} from 'lucide-react';
import { type IGetExpiredDocumentsUseCase } from '../../../domain/contracts/get-expired-documents-use-case.interface';
import { type IExportExpiredDocumentsUseCase } from '../../../domain/contracts/export-expired-documents-use-case.interface';
import { type IGetDriverByIdUseCase } from '../../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IGetDriverDocumentsUseCase } from '../../../domain/contracts/get-driver-documents-use-case.interface';
import { type IExpiredDocumentItemDTO } from '../../../domain/contracts/expired-document.dto';
import { type IDriverDetailDTO, type IDocumentDTO } from '../../../domain/contracts/driver-detail.dto';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { DriverStatusBadge } from '../components/driver-status-badge';

interface IExpiredDocumentsViewProps {
  getExpiredDocumentsUseCase: IGetExpiredDocumentsUseCase;
  exportExpiredDocumentsUseCase: IExportExpiredDocumentsUseCase;
  getDriverByIdUseCase: IGetDriverByIdUseCase;
  getDriverDocumentsUseCase: IGetDriverDocumentsUseCase;
}

type SortKey = 'fullName' | 'rfc' | 'oldestExpiryDate';

function daysFromNow(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / 86400000);
}

// Fila de dato: label a la izquierda, valor a la derecha
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-0">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-right flex-1">{value}</span>
    </div>
  );
}

export function ExpiredDocumentsView({
  getExpiredDocumentsUseCase,
  exportExpiredDocumentsUseCase,
  getDriverByIdUseCase,
  getDriverDocumentsUseCase,
}: IExpiredDocumentsViewProps) {
  const { navigateTo } = useNavigationLoading();

  // ── Lista ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<IExpiredDocumentItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortKey>('oldestExpiryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Sheet ──────────────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<IExpiredDocumentItemDTO | null>(null);
  const [driverDetail, setDriverDetail] = useState<IDriverDetailDTO | null>(null);
  const [driverDocuments, setDriverDocuments] = useState<IDocumentDTO[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Fetch inicial y re-fetch al cambiar página / sort ────────────────────
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const result = await getExpiredDocumentsUseCase.execute({
      page,
      pageSize,
      sortBy,
      sortDirection,
    });
    if (result.success && result.data) {
      setItems(result.data.items);
      setTotal(result.data.total);
    }
    setIsLoading(false);
  }, [getExpiredDocumentsUseCase, page, pageSize, sortBy, sortDirection]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalPages = Math.ceil(total / pageSize);

  const handleRowClick = useCallback(async (item: IExpiredDocumentItemDTO) => {
    setSelectedRow(item);
    setDriverDetail(null);
    setDriverDocuments([]);
    setSheetOpen(true);
    setIsLoadingDetail(true);
    // Ambos fetches en paralelo
    const [detailResult, docsResult] = await Promise.all([
      getDriverByIdUseCase.execute(item.driverId),
      getDriverDocumentsUseCase.execute(item.driverId),
    ]);
    if (detailResult.success && detailResult.data) setDriverDetail(detailResult.data);
    if (docsResult.success && docsResult.data) setDriverDocuments(docsResult.data);
    setIsLoadingDetail(false);
  }, [getDriverByIdUseCase, getDriverDocumentsUseCase]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDirection('asc'); }
    setPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);
    const result = await exportExpiredDocumentsUseCase.execute({ format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documentos-vencidos.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  };

  const expiredCount  = items.filter(i => (i.expiredDocuments?.length ?? 0) > 0).length;
  const expiringCount = items.filter(i => (i.expiringDocuments?.length ?? 0) > 0 && (i.expiredDocuments?.length ?? 0) === 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documentos Vencidos y Por Vencer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {total} driver{total !== 1 ? 's' : ''} con documentos vencidos o que vencen en los próximos 30 días
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3" />Vencido ({expiredCount})
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                  <Clock className="h-3 w-3" />Por vencer en 30 días ({expiringCount})
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isExporting}>
                    {isExporting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando...</>
                      : <><Download className="h-4 w-4 mr-2" />Exportar</>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No hay drivers con documentos vencidos o próximos a vencer</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('fullName')}>
                        <div className="flex items-center">Nombre Completo{getSortIcon('fullName')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('rfc')}>
                        <div className="flex items-center">RFC{getSortIcon('rfc')}</div>
                      </TableHead>
                      <TableHead>Documentos Vencidos</TableHead>
                      <TableHead>Documentos Por Vencer</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('oldestExpiryDate')}>
                        <div className="flex items-center">Expiración más antigua{getSortIcon('oldestExpiryDate')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => {
                      const days = daysFromNow(item.oldestExpiryDate);
                      const isExpired     = days < 0;
                      const isExpiringSoon = days >= 0 && days <= 30;
                      return (
                        <TableRow
                          key={item.driverId}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => { void handleRowClick(item); }}
                        >
                          <TableCell className="font-medium">{item.fullName}</TableCell>
                          <TableCell className="font-mono text-xs">{item.rfc}</TableCell>
                          <TableCell className="text-sm">
                            {(item.expiredDocuments?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.expiredDocuments.map(doc => (
                                  <span key={doc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <AlertTriangle className="h-3 w-3" />{doc}
                                  </span>
                                ))}
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {(item.expiringDocuments?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.expiringDocuments.map(doc => (
                                  <span key={doc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                    <Clock className="h-3 w-3" />{doc}
                                  </span>
                                ))}
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                              {new Date(item.oldestExpiryDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {isExpired    && <p className="text-xs text-red-500">Venció hace {Math.abs(days)} días</p>}
                            {isExpiringSoon && <p className="text-xs text-yellow-500">Vence en {days} día{days !== 1 ? 's' : ''}</p>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mostrar:</span>
                    <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} · Total: {total}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Sheet resumen rápido ────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={open => { setSheetOpen(open); if (!open) { setDriverDetail(null); setDriverDocuments([]); } }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedRow?.fullName ?? 'Resumen del driver'}</SheetTitle>
            <SheetDescription>Vista rápida antes de ir al detalle completo</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* ── Skeleton mientras carga ── */}
            {isLoadingDetail && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            )}

            {/* ── Contenido cargado ── */}
            {!isLoadingDetail && driverDetail && (() => {
              const d = driverDetail;
              const lastCheckIn = d.lastCheckInDate
                ? new Date(d.lastCheckInDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                : null;

              return (
                <>
                  {/* Estatus */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Estatus del driver</span>
                    <DriverStatusBadge status={d.driverStatus} />
                  </div>

                  {/* Contacto — no está en la tabla */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Contacto</p>
                    <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Teléfono"  value={d.phone} />
                    <InfoRow icon={<Mail  className="h-3.5 w-3.5" />} label="Email"     value={d.email} />
                  </div>

                  {/* Ubicación — no está en la tabla */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Ubicación</p>
                    <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Ciudad / Estado"
                      value={[d.city, d.state].filter(Boolean).join(', ')} />
                    <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Dirección"
                      value={[d.street, d.externalNumber, d.neighborhood, d.postalCode].filter(Boolean).join(' ')} />
                  </div>

                  {/* Vehículo — no está en la tabla */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Vehículo</p>
                    <InfoRow icon={<Car className="h-3.5 w-3.5" />} label="Marca / Modelo"
                      value={`${d.vehicleMake} ${d.vehicleModel} ${d.vehicleYear}`} />
                    <InfoRow icon={<Car className="h-3.5 w-3.5" />} label="Placas · Color"
                      value={`${d.vehiclePlates} · ${d.vehicleColor}`} />
                  </div>

                  {/* Operación — no está en la tabla */}
                   <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Operación</p>
                    <InfoRow icon={<Store        className="h-3.5 w-3.5" />} label="Tienda último pedido" value={d.lastOrderStore} />
                    <InfoRow icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Último check-in"     value={lastCheckIn} />
                  </div>
                </>
              );
            })()}

            {/* ── Documentos ── */}
            {!isLoadingDetail && driverDocuments.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Documentos</p>
                <div className="space-y-0">
                  {driverDocuments.map(doc => {
                    const cfg: Record<IDocumentDTO['status'], { label: string; cls: string }> = {
                      Pending:      { label: 'Pendiente',   cls: 'text-gray-600 bg-gray-100'   },
                      Unreadable:   { label: 'Ilegible',    cls: 'text-red-700 bg-red-100'     },
                      Prevalidated: { label: 'Prevalidado', cls: 'text-yellow-700 bg-yellow-100' },
                      Validated:    { label: 'Validado',    cls: 'text-green-700 bg-green-100'  },
                    };
                    const { label, cls } = cfg[doc.status];
                    const expired      = doc.expirationDate ? new Date(doc.expirationDate) < new Date() : false;
                    const expiringSoon = doc.expirationDate && !expired
                      ? daysFromNow(doc.expirationDate) <= 30
                      : false;

                    return (
                      <div key={doc.type} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{doc.label}</p>
                          {doc.expirationDate && (
                            <p className={`text-xs ${expired ? 'text-red-500' : expiringSoon ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                              Vence: {new Date(doc.expirationDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {expired && ' · Vencido'}
                              {!expired && expiringSoon && ` · ${daysFromNow(doc.expirationDate)}d`}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {!isLoadingDetail && !driverDetail && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se pudieron cargar los datos del driver.
              </p>
            )}

            {/* ── CTA ── */}
            <div className="pt-2 border-t">
              <Button
                className="w-full"
                disabled={isLoadingDetail}
                onClick={() => { setSheetOpen(false); navigateTo(`/adm/drivers/${selectedRow!.driverId}`); }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver detalle completo
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
