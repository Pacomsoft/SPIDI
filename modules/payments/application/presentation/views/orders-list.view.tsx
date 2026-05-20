'use client';

import { useState, useEffect } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { type IGetOrdersUseCase } from '../../../domain/contracts/get-orders-use-case.interface';
import { type IExportOrdersUseCase } from '../../../domain/contracts/export-orders-use-case.interface';
import { type IGetStoresUseCase } from '../../../domain/contracts/get-stores-use-case.interface';
import { type OrderStatus, type IStoreDTO } from '../../../domain/contracts/order.dto';
import { useOrdersList } from '../../hooks/use-orders-list.hook';
import { OrderStatusBadge } from '../components/order-status-badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SearchableSelect } from '../ui/searchable-select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IOrdersListViewProps {
  getOrdersUseCase: IGetOrdersUseCase;
  exportOrdersUseCase: IExportOrdersUseCase;
  getStoresUseCase: IGetStoresUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'orderId' | 'deliveryDateTime' | 'driverName' | 'store' | 'orderStatus' | 'paymentAmount';

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'Delivered', label: 'Entregado' },
  { value: 'Cancelled', label: 'Cancelado' },
  { value: 'Pending', label: 'Pendiente' },
  { value: 'InRoute', label: 'En ruta' },
];

export function OrdersListView({ getOrdersUseCase, exportOrdersUseCase, getStoresUseCase }: IOrdersListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const [storeOptions, setStoreOptions] = useState<IStoreDTO[]>([]);
  const {
    orders, total, isLoading, page, pageSize, sortBy, sortDirection,
    search, dateFrom, dateTo, orderStatus, store, isExporting,
    setPage, setPageSize, setSortBy, setSortDirection,
    setSearch, setDateFrom, setDateTo, setOrderStatus, setStore,
    handleExport, clearFilters,
  } = useOrdersList(getOrdersUseCase, exportOrdersUseCase);

  // Carga el catálogo de tiendas desde el backend (una sola vez al montar)
  useEffect(() => {
    getStoresUseCase.execute().then(result => {
      if (result.success && result.data) setStoreOptions(result.data);
    });
  }, [getStoresUseCase]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('deliveryDateTime'); setSortDirection('desc'); }
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

  const addStatus = (status: OrderStatus) => {
    if (!orderStatus.includes(status)) setOrderStatus([...orderStatus, status]);
  };

  const removeStatus = (status: OrderStatus) => {
    setOrderStatus(orderStatus.filter(s => s !== status));
  };

  const addStore = (s: string) => {
    if (!store.includes(s)) setStore([...store, s]);
  };

  const removeStore = (s: string) => {
    setStore(store.filter(x => x !== s));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h1>
              <p className="text-sm text-muted-foreground mt-1">{total} pedidos en total</p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Buscar por N° pedido, driver..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto" disabled={isExporting}>
                      <Download className="mr-2 h-4 w-4" />
                      {isExporting ? 'Exportando…' : 'Exportar'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>
                      Excel (.xlsx)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha desde</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha hasta</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estatus del pedido</label>
                  <Select
                    value=""
                    onValueChange={v => addStatus(v as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Agregar estatus…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.filter(opt => !orderStatus.includes(opt.value)).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {orderStatus.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {orderStatus.map(s => {
                        const label = ORDER_STATUS_OPTIONS.find(o => o.value === s)?.label ?? s;
                        return (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium bg-muted">
                            {label}
                            <button onClick={() => removeStatus(s)} className="hover:text-destructive transition-colors ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tienda</label>
                  <SearchableSelect
                    placeholder="Agregar tienda…"
                    searchPlaceholder="Buscar tienda…"
                    emptyMessage="Sin tiendas disponibles"
                    options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
                    selectedValues={store}
                    onSelect={v => addStore(v)}
                  />
                  {store.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {store.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium bg-muted">
                          {s}
                          <button onClick={() => removeStore(s)} className="hover:text-destructive transition-colors ml-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron pedidos con los filtros seleccionados</p>
              <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('orderId')}>
                        <div className="flex items-center">N° Pedido{getSortIcon('orderId')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('driverName')}>
                        <div className="flex items-center">Driver{getSortIcon('driverName')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('deliveryDateTime')}>
                        <div className="flex items-center">Fecha/Hora Entrega{getSortIcon('deliveryDateTime')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('store')}>
                        <div className="flex items-center">Tienda{getSortIcon('store')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('orderStatus')}>
                        <div className="flex items-center">Estatus{getSortIcon('orderStatus')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('paymentAmount')}>
                        <div className="flex items-center justify-end">Monto a Pagar{getSortIcon('paymentAmount')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow
                        key={order.orderId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigateTo(`/adm/pagos/pedidos/${order.orderId}`)}
                      >
                        <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                        <TableCell className="font-medium">{order.driverName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.deliveryDateTime).toLocaleString('es-MX')}
                        </TableCell>
                        <TableCell>{order.store}</TableCell>
                        <TableCell><OrderStatusBadge status={order.orderStatus} /></TableCell>
                        <TableCell className="text-right font-medium">{fmt(order.paymentAmount)}</TableCell>
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
                    Página {page} de {totalPages} · Total: {total} pedidos
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
