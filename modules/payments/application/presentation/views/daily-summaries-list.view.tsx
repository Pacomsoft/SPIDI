'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { Download, FilterX, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { type IGetDailySummariesUseCase } from '../../../domain/contracts/get-daily-summaries-use-case.interface';
import { type IExportDailySummariesUseCase } from '../../../domain/contracts/export-daily-summaries-use-case.interface';
import { useDailySummariesList } from '../../hooks/use-daily-summaries-list.hook';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IDailySummariesListViewProps {
  getDailySummariesUseCase: IGetDailySummariesUseCase;
  exportDailySummariesUseCase: IExportDailySummariesUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'summaryDate' | 'driverName' | 'totalAmount' | 'orderCount' | 'checkinCount';

export function DailySummariesListView({ getDailySummariesUseCase, exportDailySummariesUseCase }: IDailySummariesListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const {
    summaries, total, isLoading, page, pageSize, sortBy, sortDirection,
    driverSearch, dateFrom, dateTo,
    setPage, setPageSize, setSortBy, setSortDirection,
    setDriverSearch, setDateFrom, setDateTo,
    handleExport, clearFilters, isExporting,
  } = useDailySummariesList(getDailySummariesUseCase, exportDailySummariesUseCase);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('summaryDate'); setSortDirection('desc'); }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resúmenes Diarios</h1>
                <p className="text-sm text-muted-foreground mt-1">{total} resúmenes en total</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  <FilterX className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Limpiar filtros</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting
                        ? <><Loader2 className="sm:mr-2 h-4 w-4 animate-spin" /><span className="hidden sm:inline">Exportando…</span></>
                        : <><Download className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Exportar</span></>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Buscar por driver, RFC..."
                value={driverSearch}
                onChange={e => setDriverSearch(e.target.value)}
                className="flex-1"
              />
              <div className="space-y-2 shrink-0">
                <label className="text-sm font-medium">Fecha desde</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2 shrink-0">
                <label className="text-sm font-medium">Fecha hasta</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron resúmenes con los filtros seleccionados</p>
              <Button variant="outline" onClick={clearFilters}><FilterX className="mr-2 h-4 w-4" />Limpiar filtros</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('driverName')}>
                        <div className="flex items-center">Driver{getSortIcon('driverName')}</div>
                      </TableHead>
                      <TableHead>RFC</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('summaryDate')}>
                        <div className="flex items-center">Fecha resumen{getSortIcon('summaryDate')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('checkinCount')}>
                        <div className="flex items-center justify-end">Check-ins{getSortIcon('checkinCount')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('orderCount')}>
                        <div className="flex items-center justify-end">Pedidos{getSortIcon('orderCount')}</div>
                      </TableHead>
                      <TableHead className="text-right">M. Pedidos</TableHead>
                      <TableHead className="text-right">M. Bonos</TableHead>
                      <TableHead className="text-right">M. Ajustes</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('totalAmount')}>
                        <div className="flex items-center justify-end">Total{getSortIcon('totalAmount')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map(s => (
                      <TableRow
                        key={s.summaryId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigateTo(`/adm/pagos/resumenes-diarios/${s.summaryId}`)}
                      >
                        <TableCell className="font-medium">
                          <a
                            href={`/adm/drivers/${s.driverId}`}
                            className="font-medium underline decoration-dotted underline-offset-2 hover:text-muted-foreground transition-colors"
                            onClick={e => { e.stopPropagation(); navigateTo(`/adm/drivers/${s.driverId}`); }}
                          >
                            {s.driverName}
                          </a>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{s.rfc}</TableCell>
                        <TableCell className="text-sm">{new Date(s.summaryDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell className="text-right">{s.checkinCount}</TableCell>
                        <TableCell className="text-right">{s.orderCount}</TableCell>
                        <TableCell className="text-right">{fmt(s.ordersAmount)}</TableCell>
                        <TableCell className="text-right text-green-600">{fmt(s.bonusAmount)}</TableCell>
                        <TableCell className={`text-right ${s.adjustmentAmount < 0 ? 'text-red-600' : s.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>
                          {fmt(s.adjustmentAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{fmt(s.totalAmount)}</TableCell>
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
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} · Total: {total} resúmenes
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
  );
}
