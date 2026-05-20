'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type IGetWeeklySummariesUseCase } from '../../domain/contracts/get-weekly-summaries-use-case.interface';
import { type IExportWeeklySummariesUseCase } from '../../domain/contracts/export-weekly-summaries-use-case.interface';
import { type IWeeklySummaryListItemDTO, type IWeeklySummaryFiltersDTO } from '../../domain/contracts/weekly-summary.dto';

export interface IUseWeeklySummariesListResult {
  summaries: IWeeklySummaryListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  driverSearch: string;
  dateFrom: string;
  dateTo: string;
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setDriverSearch: (search: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useWeeklySummariesList(
  getWeeklySummariesUseCase: IGetWeeklySummariesUseCase,
  exportWeeklySummariesUseCase: IExportWeeklySummariesUseCase,
): IUseWeeklySummariesListResult {
  const [summaries, setSummaries] = useState<IWeeklySummaryListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('weekStartDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [driverSearch, setDriverSearchRaw] = useState('');
  const [debouncedDriverSearch, setDebouncedDriverSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDriverSearch = useCallback((value: string) => {
    setDriverSearchRaw(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedDriverSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const fetchSummaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: IWeeklySummaryFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      driverSearch: debouncedDriverSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    const result = await getWeeklySummariesUseCase.execute(filters);
    if (result.success && result.data) {
      setSummaries(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar resúmenes semanales');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, debouncedDriverSearch, dateFrom, dateTo, getWeeklySummariesUseCase]);

  useEffect(() => { void fetchSummaries(); }, [fetchSummaries]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: IWeeklySummaryFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      driverSearch: debouncedDriverSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    const result = await exportWeeklySummariesUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly_summaries_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, debouncedDriverSearch, dateFrom, dateTo, exportWeeklySummariesUseCase]);

  const clearFilters = useCallback(() => {
    setDriverSearchRaw('');
    setDebouncedDriverSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);

  return {
    summaries, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    driverSearch, dateFrom, dateTo,
    isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setDriverSearch,
    setDateFrom,
    setDateTo,
    handleExport,
    clearFilters,
  };
}
