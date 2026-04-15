'use client';

import { useState, useEffect } from 'react';
import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IStateDTO } from '../../domain/contracts/state.dto';

interface IUseStatesResult {
  states: IStateDTO[];
  isLoading: boolean;
  error: string | null;
}

export function useStates(
  getStatesUseCase: IUseCase<void, IStateDTO[]>,
): IUseStatesResult {
  const [states, setStates] = useState<IStateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getStatesUseCase.execute();
        if (!cancelled) setStates(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar los estados');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchStates();
    return () => { cancelled = true; };
  }, [getStatesUseCase]);

  return { states, isLoading, error };
}
