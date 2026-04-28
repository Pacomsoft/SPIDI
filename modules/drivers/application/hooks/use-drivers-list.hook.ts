'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type IGetDriversUseCase } from '../../domain/contracts/get-drivers-use-case.interface';
import { type IExportDriversUseCase } from '../../domain/contracts/export-drivers-use-case.interface';
import { type IGetDriverCatalogsUseCase } from '../../domain/contracts/get-driver-catalogs-use-case.interface';
import { type IDriverListItemDTO, type IDriverFiltersDTO, type ICatalogItemDTO } from '../../domain/contracts/driver-list.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

export interface IUseDriversListResult {
  drivers: IDriverListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  driverStatusFilter: string[];
  stateFilter: string;
  storeFilter: string;
  states: ICatalogItemDTO[];
  stores: ICatalogItemDTO[];
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  setDriverStatusFilter: (statuses: string[]) => void;
  setStateFilter: (state: string) => void;
  setStoreFilter: (store: string) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useDriversList(
  getDriversUseCase: IGetDriversUseCase,
  exportDriversUseCase: IExportDriversUseCase,
  getCatalogsUseCase: IGetDriverCatalogsUseCase,
): IUseDriversListResult {
  const [drivers, setDrivers] = useState<IDriverListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('lastOrderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [search, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string[]>(['Enabled']);
  const [stateFilter, setStateFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [states, setStates] = useState<ICatalogItemDTO[]>([]);
  const [stores, setStores] = useState<ICatalogItemDTO[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    const loadCatalogs = async () => {
      const [statesResult, storesResult] = await Promise.all([
        getCatalogsUseCase.execute(API_ENDPOINTS.CATALOGS_STATES),
        getCatalogsUseCase.execute(API_ENDPOINTS.CATALOGS_STORES),
      ]);
      if (statesResult.success && statesResult.data) setStates(statesResult.data);
      if (storesResult.success && storesResult.data) setStores(storesResult.data);
    };
    void loadCatalogs();
  }, [getCatalogsUseCase]);

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: IDriverFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
      driverStatus: driverStatusFilter.length > 0 ? driverStatusFilter : undefined,
      stateOfCountry: stateFilter || undefined,
      lastOrderStore: storeFilter || undefined,
    };
    const result = await getDriversUseCase.execute(filters);
    if (result.success && result.data) {
      setDrivers(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar drivers');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, debouncedSearch, driverStatusFilter, stateFilter, storeFilter, getDriversUseCase]);

  useEffect(() => { void fetchDrivers(); }, [fetchDrivers]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: IDriverFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
      driverStatus: driverStatusFilter.length > 0 ? driverStatusFilter : undefined,
      stateOfCountry: stateFilter || undefined,
      lastOrderStore: storeFilter || undefined,
    };
    const result = await exportDriversUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drivers_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, debouncedSearch, driverStatusFilter, stateFilter, storeFilter, exportDriversUseCase]);

  const clearFilters = useCallback(() => {
    setSearchRaw('');
    setDebouncedSearch('');
    setDriverStatusFilter(['Enabled']);
    setStateFilter('');
    setStoreFilter('');
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);
  const handleSetDriverStatusFilter = useCallback((v: string[]) => { setDriverStatusFilter(v); setPage(1); }, []);
  const handleSetStateFilter = useCallback((v: string) => { setStateFilter(v); setPage(1); }, []);
  const handleSetStoreFilter = useCallback((v: string) => { setStoreFilter(v); setPage(1); }, []);

  return {
    drivers, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    search, driverStatusFilter, stateFilter, storeFilter,
    states, stores, isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setSearch,
    setDriverStatusFilter: handleSetDriverStatusFilter,
    setStateFilter: handleSetStateFilter,
    setStoreFilter: handleSetStoreFilter,
    handleExport, clearFilters,
  };
}
