'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { IGetTrainingsUseCase } from '../../domain/contracts/get-trainings-use-case.interface';
import type { IExportTrainingsUseCase } from '../../domain/contracts/export-trainings-use-case.interface';
import type { ITrainingListItemDTO, ITrainingFiltersDTO } from '../../domain/contracts/training.dto';

export interface IUseTrainingsListResult {
  trainings: ITrainingListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useTrainingsList(
  getTrainingsUseCase: IGetTrainingsUseCase,
  exportTrainingsUseCase: IExportTrainingsUseCase,
): IUseTrainingsListResult {
  const [trainings, setTrainings] = useState<ITrainingListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [search, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const fetchTrainings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: ITrainingFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
    };
    const result = await getTrainingsUseCase.execute(filters);
    if (result.success && result.data) {
      setTrainings(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar capacitaciones');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, debouncedSearch, getTrainingsUseCase]);

  useEffect(() => { void fetchTrainings(); }, [fetchTrainings]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: ITrainingFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      search: debouncedSearch || undefined,
    };
    const result = await exportTrainingsUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `capacitaciones_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, debouncedSearch, exportTrainingsUseCase]);

  const clearFilters = useCallback(() => {
    setSearchRaw('');
    setDebouncedSearch('');
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);

  return {
    trainings, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    search, isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setSearch,
    handleExport,
    clearFilters,
  };
}
