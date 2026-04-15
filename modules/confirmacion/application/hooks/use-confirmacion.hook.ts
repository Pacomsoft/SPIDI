'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type IGetConfirmationUseCase } from '../../domain/contracts/get-confirmation.use-case.interface';
import { type IConfirmationDataDTO } from '../../domain/contracts/confirmation.dto';
import { RegistrationSessionNotFoundError } from '../../domain/errors/registration-session-not-found.error';

interface IUseConfirmacionResult {
  data: IConfirmationDataDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function useConfirmacion(
  getConfirmationUseCase: IGetConfirmationUseCase,
): IUseConfirmacionResult {
  const router = useRouter();
  const [data, setData] = useState<IConfirmationDataDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await getConfirmationUseCase.execute();
        if (!cancelled) setData(result);
      } catch (err) {
        if (err instanceof RegistrationSessionNotFoundError) {
          router.push('/registro');
          return;
        }
        if (!cancelled) setError('Error al cargar la confirmación.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [getConfirmationUseCase, router]);

  return { data, isLoading, error };
}
