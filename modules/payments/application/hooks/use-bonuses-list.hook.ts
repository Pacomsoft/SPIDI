'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type IGetBonusesUseCase } from '../../domain/contracts/get-bonuses-use-case.interface';
import { type IExportBonusesUseCase } from '../../domain/contracts/export-bonuses-use-case.interface';
import { type IBonusListItemDTO, type IBonusFiltersDTO, type BonusType } from '../../domain/contracts/bonus.dto';

export interface IUseBonusesListResult {
  bonuses: IBonusListItemDTO[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  startDateFrom: string;
  startDateTo: string;
  endDateFrom: string;
  endDateTo: string;
  store: string[];
  bonusType: BonusType[];
  isExporting: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setStartDateFrom: (date: string) => void;
  setStartDateTo: (date: string) => void;
  setEndDateFrom: (date: string) => void;
  setEndDateTo: (date: string) => void;
  setStore: (stores: string[]) => void;
  setBonusType: (types: BonusType[]) => void;
  handleExport: (format: string) => Promise<void>;
  clearFilters: () => void;
}

export function useBonusesList(
  getBonusesUseCase: IGetBonusesUseCase,
  exportBonusesUseCase: IExportBonusesUseCase,
): IUseBonusesListResult {
  const [bonuses, setBonuses] = useState<IBonusListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [endDateFrom, setEndDateFrom] = useState('');
  const [endDateTo, setEndDateTo] = useState('');
  const [store, setStore] = useState<string[]>([]);
  const [bonusType, setBonusType] = useState<BonusType[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchBonuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: IBonusFiltersDTO = {
      page,
      pageSize,
      sortBy,
      sortDirection,
      startDateFrom: startDateFrom || undefined,
      startDateTo: startDateTo || undefined,
      endDateFrom: endDateFrom || undefined,
      endDateTo: endDateTo || undefined,
      store: store.length > 0 ? store : undefined,
      bonusType: bonusType.length > 0 ? bonusType : undefined,
    };
    const result = await getBonusesUseCase.execute(filters);
    if (result.success && result.data) {
      setBonuses(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error?.message ?? 'Error al cargar bonos');
    }
    setIsLoading(false);
  }, [page, pageSize, sortBy, sortDirection, startDateFrom, startDateTo, endDateFrom, endDateTo, store, bonusType, getBonusesUseCase]);

  useEffect(() => { void fetchBonuses(); }, [fetchBonuses]);

  const handleExport = useCallback(async (format: string) => {
    setIsExporting(true);
    const filters: IBonusFiltersDTO = {
      page: 1,
      pageSize: 99999,
      sortBy,
      sortDirection,
      startDateFrom: startDateFrom || undefined,
      startDateTo: startDateTo || undefined,
      endDateFrom: endDateFrom || undefined,
      endDateTo: endDateTo || undefined,
      store: store.length > 0 ? store : undefined,
      bonusType: bonusType.length > 0 ? bonusType : undefined,
    };
    const result = await exportBonusesUseCase.execute({ filters, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bonuses_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  }, [sortBy, sortDirection, startDateFrom, startDateTo, endDateFrom, endDateTo, store, bonusType, exportBonusesUseCase]);

  const clearFilters = useCallback(() => {
    setStartDateFrom('');
    setStartDateTo('');
    setEndDateFrom('');
    setEndDateTo('');
    setStore([]);
    setBonusType([]);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => { setPage(p); }, []);
  const handleSetPageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);
  const handleSetSortBy = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handleSetSortDirection = useCallback((d: 'asc' | 'desc') => { setSortDirection(d); setPage(1); }, []);
  const handleSetStore = useCallback((v: string[]) => { setStore(v); setPage(1); }, []);
  const handleSetBonusType = useCallback((v: BonusType[]) => { setBonusType(v); setPage(1); }, []);

  return {
    bonuses, total, isLoading, error,
    page, pageSize, sortBy, sortDirection,
    startDateFrom, startDateTo, endDateFrom, endDateTo, store, bonusType,
    isExporting,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setSortBy: handleSetSortBy,
    setSortDirection: handleSetSortDirection,
    setStartDateFrom,
    setStartDateTo,
    setEndDateFrom,
    setEndDateTo,
    setStore: handleSetStore,
    setBonusType: handleSetBonusType,
    handleExport,
    clearFilters,
  };
}
