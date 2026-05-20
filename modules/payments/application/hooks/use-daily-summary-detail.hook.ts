'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { type IGetDailySummaryByIdUseCase } from '../../domain/contracts/get-daily-summary-by-id-use-case.interface';
import { type IDailySummaryDetailDTO } from '../../domain/contracts/daily-summary.dto';

export interface IUseDailySummaryDetailResult {
  summary: IDailySummaryDetailDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function useDailySummaryDetail(
  getDailySummaryByIdUseCase: IGetDailySummaryByIdUseCase,
): IUseDailySummaryDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [summary, setSummary] = useState<IDailySummaryDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getDailySummaryByIdUseCase.execute(id);
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error?.message ?? 'Error al cargar el resumen diario');
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getDailySummaryByIdUseCase]);

  return { summary, isLoading, error };
}
