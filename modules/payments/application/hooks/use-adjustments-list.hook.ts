'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type IGetAdjustmentsUseCase } from '../../domain/contracts/get-adjustments-use-case.interface';
import { type IExportAdjustmentsUseCase } from '../../domain/contracts/export-adjustments-use-case.interface';
import { type IAdjustmentListItemDTO, type IAdjustmentFiltersDTO, type AdjustmentType } from '../../domain/contracts/adjustment.dto';

export interface IUseAdjustmentsListResult {
  adjustments: IAdjustmentListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  driverName: string;
  applicationDateFrom: string;
  applicationDateTo: string;
  store: string[];
  adjustmentType: AdjustmentType[];
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setDriverName: (name: string) => void;
  setApplicationDateFrom: (date: string) => void;
  setApplicationDateTo: (date: string) => void;
  setStore: (stores: string[]) => void;
  setAdjustmentType: (types: AdjustmentType[]) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useAdjustmentsList(
  getAdjustmentsUseCase: IGetAdjustmentsUseCase,
  exportAdjustmentsUseCase: IExportAdjustmentsUseCase,
): IUseAdjustmentsListResult {
  const [adjustments, setAdjustments] = useState<IAdjustmentListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [driverName, setDriverNameRaw] = useState('');
  const [debouncedDriverName, setDebouncedDriverName] = useState('');
  const [applicationDateFrom, setApplicationDateFrom] = useState('');
  const [applicationDateTo, setApplicationDateTo] = useState('');
  const [store, setStore] = useState<string[]>([]);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDriverName = useCallback((value: string) => {
    setDriverNameRaw(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedDriverName(value);
      setPage(1);
    }, 300);
  }, []);

  const fetchAdjustments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: IAdjustmentFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      driverName: debouncedDriverName || undefined,
      applicationDateFrom: applicationDateFrom || undefined,
      applicationDateTo: applicationDateTo || undefined,
      store: store.length > 0 ? store : undefined,
      adjustmentType: adjustmentType.length > 0 ? adjustmentType : undefined,
    };
    const result = await getAdjustmentsUseCase.execute(filters);
    if (result.success && result.data) {
      setAdjustments(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar ajustes');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, debouncedDriverName, applicationDateFrom, applicationDateTo, store, adjustmentType, getAdjustmentsUseCase]);

  useEffect(() => { void fetchAdjustments(); }, [fetchAdjustments]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: IAdjustmentFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      driverName: debouncedDriverName || undefined,
      applicationDateFrom: applicationDateFrom || undefined,
      applicationDateTo: applicationDateTo || undefined,
      store: store.length > 0 ? store : undefined,
      adjustmentType: adjustmentType.length > 0 ? adjustmentType : undefined,
    };
    const result = await exportAdjustmentsUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `adjustments_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, debouncedDriverName, applicationDateFrom, applicationDateTo, store, adjustmentType, exportAdjustmentsUseCase]);

  const clearFilters = useCallback(() => {
    setDriverNameRaw('');
    setDebouncedDriverName('');
    setApplicationDateFrom('');
    setApplicationDateTo('');
    setStore([]);
    setAdjustmentType([]);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);
  const handleSetStore = useCallback((v: string[]) => { setStore(v); setPage(1); }, []);
  const handleSetAdjustmentType = useCallback((v: AdjustmentType[]) => { setAdjustmentType(v); setPage(1); }, []);

  return {
    adjustments, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    driverName, applicationDateFrom, applicationDateTo, store, adjustmentType,
    isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setDriverName,
    setApplicationDateFrom,
    setApplicationDateTo,
    setStore: handleSetStore,
    setAdjustmentType: handleSetAdjustmentType,
    handleExport,
    clearFilters,
  };
}
