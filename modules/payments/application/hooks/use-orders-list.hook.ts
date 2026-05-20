'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type IGetOrdersUseCase } from '../../domain/contracts/get-orders-use-case.interface';
import { type IExportOrdersUseCase } from '../../domain/contracts/export-orders-use-case.interface';
import { type IOrderListItemDTO, type IOrderFiltersDTO, type OrderStatus } from '../../domain/contracts/order.dto';

export interface IUseOrdersListResult {
  orders: IOrderListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  driverName: string;
  dateFrom: string;
  dateTo: string;
  orderStatus: OrderStatus[];
  store: string[];
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  setDriverName: (name: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setOrderStatus: (statuses: OrderStatus[]) => void;
  setStore: (stores: string[]) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useOrdersList(
  getOrdersUseCase: IGetOrdersUseCase,
  exportOrdersUseCase: IExportOrdersUseCase,
): IUseOrdersListResult {
  const [orders, setOrders] = useState<IOrderListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('deliveryDateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [search, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [driverName, setDriverNameRaw] = useState('');
  const [debouncedDriverName, setDebouncedDriverName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus[]>([]);
  const [store, setStore] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const setDriverName = useCallback((value: string) => {
    setDriverNameRaw(value);
    if (driverNameDebounceRef.current) clearTimeout(driverNameDebounceRef.current);
    driverNameDebounceRef.current = setTimeout(() => {
      setDebouncedDriverName(value);
      setPage(1);
    }, 300);
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: IOrderFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
      driverName: debouncedDriverName || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      orderStatus: orderStatus.length > 0 ? orderStatus : undefined,
      store: store.length > 0 ? store : undefined,
    };
    const result = await getOrdersUseCase.execute(filters);
    if (result.success && result.data) {
      setOrders(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar pedidos');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, debouncedSearch, debouncedDriverName, dateFrom, dateTo, orderStatus, store, getOrdersUseCase]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: IOrderFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
      driverName: debouncedDriverName || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      orderStatus: orderStatus.length > 0 ? orderStatus : undefined,
      store: store.length > 0 ? store : undefined,
    };
    const result = await exportOrdersUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, debouncedSearch, debouncedDriverName, dateFrom, dateTo, orderStatus, store, exportOrdersUseCase]);

  const clearFilters = useCallback(() => {
    setSearchRaw('');
    setDebouncedSearch('');
    setDriverNameRaw('');
    setDebouncedDriverName('');
    setDateFrom('');
    setDateTo('');
    setOrderStatus([]);
    setStore([]);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);
  const handleSetOrderStatus = useCallback((v: OrderStatus[]) => { setOrderStatus(v); setPage(1); }, []);
  const handleSetStore = useCallback((v: string[]) => { setStore(v); setPage(1); }, []);

  return {
    orders, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    search, driverName, dateFrom, dateTo, orderStatus, store,
    isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setSearch,
    setDriverName,
    setDateFrom,
    setDateTo,
    setOrderStatus: handleSetOrderStatus,
    setStore: handleSetStore,
    handleExport,
    clearFilters,
  };
}
