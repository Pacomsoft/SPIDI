'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { Download, FilterX, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { type IGetWeeklySummariesUseCase } from '../../../domain/contracts/get-weekly-summaries-use-case.interface';
import { type IExportWeeklySummariesUseCase } from '../../../domain/contracts/export-weekly-summaries-use-case.interface';
import { useWeeklySummariesList } from '../../hooks/use-weekly-summaries-list.hook';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IWeeklySummariesListViewProps {
  getWeeklySummariesUseCase: IGetWeeklySummariesUseCase;
  exportWeeklySummariesUseCase: IExportWeeklySummariesUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'weekStartDate' | 'driverName' | 'totalAmount' | 'ordersAmount' | 'bonusAmount' | 'adjustmentAmount';

export function WeeklySummariesListView({ getWeeklySummariesUseCase, exportWeeklySummariesUseCase }: IWeeklySummariesListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const {
    summaries, total, isLoading, page, pageSize, sortBy, sortDirection,
    driverSearch, dateFrom, dateTo, isExporting,
    setPage, setPageSize, setSortBy, setSortDirection,
    setDriverSearch, setDateFrom, setDateTo,
    handleExport, clearFilters,
  } = useWeeklySummariesList(getWeeklySummariesUseCase, exportWeeklySummariesUseCase);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('weekStartDate'); setSortDirection('desc'); }
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

            {/* Título + acciones */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resúmenes Semanales</h1>
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

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Driver / RFC
                </label>
                <Input
                  placeholder="Buscar por driver o RFC…"
                  value={driverSearch}
                  onChange={e => setDriverSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Semana desde
                </label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Semana hasta
                </label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>

          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(pageSize > 10 ? 10 : pageSize)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
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
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('driverName')}
                      >
                        <div className="flex items-center">Driver{getSortIcon('driverName')}</div>
                      </TableHead>
                      <TableHead>RFC</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('weekStartDate')}
                      >
                        <div className="flex items-center">Semana (lunes){getSortIcon('weekStartDate')}</div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort('ordersAmount')}
                      >
                        <div className="flex items-center justify-end">M. Pedidos{getSortIcon('ordersAmount')}</div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort('bonusAmount')}
                      >
                        <div className="flex items-center justify-end">M. Bonos{getSortIcon('bonusAmount')}</div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort('adjustmentAmount')}
                      >
                        <div className="flex items-center justify-end">M. Ajustes{getSortIcon('adjustmentAmount')}</div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center justify-end">Total{getSortIcon('totalAmount')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map(s => (
                      <TableRow
                        key={s.summaryId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigateTo(`/adm/pagos/resumenes-semanales/${s.summaryId}`)}
                      >
                        {/* Driver — link sutil, no rojo HEB */}
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
                        {/* Fecha del lunes de la semana */}
                        <TableCell className="text-sm">
                          {new Date(s.weekStartDate).toLocaleDateString('es-MX', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                        {/* M. Pedidos — siempre positivo */}
                        <TableCell className="text-right text-green-600">{fmt(s.ordersAmount)}</TableCell>
                        {/* M. Bonos — verde si > 0, neutro si = 0 */}
                        <TableCell className={`text-right ${s.bonusAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {fmt(s.bonusAmount)}
                        </TableCell>
                        {/* M. Ajustes — rojo/verde/neutro por signo */}
                        <TableCell className={`text-right ${s.adjustmentAmount < 0 ? 'text-red-600' : s.adjustmentAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {fmt(s.adjustmentAmount)}
                        </TableCell>
                        {/* Total */}
                        <TableCell className={`text-right font-bold ${s.totalAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {fmt(s.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
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
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} · Total: {total} resúmenes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
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
