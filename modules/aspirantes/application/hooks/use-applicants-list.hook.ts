'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { IGetApplicantsUseCase } from '../../domain/contracts/get-applicants-use-case.interface';
import type { IExportApplicantsUseCase } from '../../domain/contracts/export-applicants-use-case.interface';
import type { IGetApplicantCatalogsUseCase } from '../../domain/contracts/get-applicant-catalogs-use-case.interface';
import type { IApplicantListItemDTO, IApplicantFiltersDTO, ICatalogItemDTO } from '../../domain/contracts/applicant-list.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

const DEFAULT_FILTERS: IApplicantFiltersDTO = {
  page: 1,
  pageSize: 20,
  sortBy: 'registrationDate',
  sortDirection: 'desc',
  search: '',
  applicationStatus: '',
  documentationStatus: '',
  location: '',
};

export function useApplicantsList(
  getApplicantsUseCase: IGetApplicantsUseCase,
  exportApplicantsUseCase: IExportApplicantsUseCase,
  getCatalogsUseCase: IGetApplicantCatalogsUseCase,
) {
  const [items, setItems] = useState<IApplicantListItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<IApplicantFiltersDTO>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [locations, setLocations] = useState<ICatalogItemDTO[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ICatalogItemDTO[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchApplicants = useCallback(
    async (currentFilters: IApplicantFiltersDTO) => {
      setIsLoading(true);
      const result = await getApplicantsUseCase.execute(currentFilters);
      if (result.success && result.data) {
        setItems(result.data.items);
        setTotal(result.data.total);
      }
      setIsLoading(false);
    },
    [getApplicantsUseCase],
  );

  useEffect(() => {
    void fetchApplicants(filters);
  }, [filters, fetchApplicants]);

  useEffect(() => {
    const loadCatalogs = async () => {
      const result = await getCatalogsUseCase.execute({
        endpoints: [API_ENDPOINTS.CATALOGS_STATES, API_ENDPOINTS.CATALOGS_APPLICATION_STATUSES],
      });
      if (result[API_ENDPOINTS.CATALOGS_STATES]) {
        setLocations(result[API_ENDPOINTS.CATALOGS_STATES]);
      }
      if (result[API_ENDPOINTS.CATALOGS_APPLICATION_STATUSES]) {
        setApplicationStatuses(result[API_ENDPOINTS.CATALOGS_APPLICATION_STATUSES]);
      }
    };
    void loadCatalogs();
  }, [getCatalogsUseCase]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value, page: 1 }));
      }, 300);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (key: keyof IApplicantFiltersDTO, value: string | number) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    [],
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const handleSortChange = useCallback(
    (sortBy: string) => {
      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortDirection:
          prev.sortBy === sortBy ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
        page: 1,
      }));
    },
    [],
  );

  const handleExport = useCallback(
    async (format: string) => {
      const result = await exportApplicantsUseCase.execute({ filters, format });
      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aspirantes_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [exportApplicantsUseCase, filters],
  );

  const totalPages = Math.ceil(total / filters.pageSize);

  return {
    items,
    total,
    totalPages,
    isLoading,
    filters,
    searchInput,
    locations,
    applicationStatuses,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleExport,
  };
}
