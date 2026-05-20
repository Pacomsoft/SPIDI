'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { type IGetWeeklySummaryByIdUseCase } from '../../domain/contracts/get-weekly-summary-by-id-use-case.interface';
import { type IWeeklySummaryDetailDTO } from '../../domain/contracts/weekly-summary.dto';

export interface IUseWeeklySummaryDetailResult {
  summary: IWeeklySummaryDetailDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function useWeeklySummaryDetail(
  getWeeklySummaryByIdUseCase: IGetWeeklySummaryByIdUseCase,
): IUseWeeklySummaryDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [summary, setSummary] = useState<IWeeklySummaryDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getWeeklySummaryByIdUseCase.execute(id);
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error?.message ?? 'Error al cargar el resumen semanal');
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getWeeklySummaryByIdUseCase]);

  return { summary, isLoading, error };
}
