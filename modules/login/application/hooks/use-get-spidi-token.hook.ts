'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type IAuthService } from '../../domain/contracts/auth-service.interface';
import { type IValidateTokenUseCase } from '../../domain/contracts/validate-token-use-case.interface';
import { TooManyAttemptsError } from '../../domain/errors/too-many-attempts.error';
import { AccountDisabledError } from '../../domain/errors/account-disabled.error';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';

type ErrorType = 'invalid_credentials' | 'too_many_attempts' | 'account_disabled' | 'generic';

interface IUseGetSpidiTokenResult {
  isProcessing: boolean;
  error: string | null;
}

export function useGetSpidiToken(
  validateTokenUseCase: IValidateTokenUseCase,
  authService: IAuthService,
): IUseGetSpidiTokenResult {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    const msSession = authService.getMsSession();

    if (!msSession) {
      setIsProcessing(false);
      router.replace('/login?error=invalid_credentials');
      return;
    }

    const { msAccessToken, userId, userName, userEmail } = msSession;

    // Clean up MS token from sessionStorage after reading
    authService.clearMsSession();

    const redirectAfterLogin =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('redirect_after_login') ?? undefined)
        : undefined;

    validateTokenUseCase
      .execute({ msAccessToken, userId, userName, userEmail, redirectAfterLogin })
      .then((result) => {
        router.replace(result.redirectPath);
      })
      .catch((err: unknown) => {
        setIsProcessing(false);
        let errorType: ErrorType = 'invalid_credentials';
        let errorMsg = 'Credenciales no válidas, por favor vuelve a intentar.';

        if (err instanceof TooManyAttemptsError) {
          errorType = 'too_many_attempts';
          errorMsg = err.message;
        } else if (err instanceof AccountDisabledError) {
          errorType = 'account_disabled';
          errorMsg = err.message;
        } else if (err instanceof FetchError) {
          console.warn('Error de red o del servidor durante la autenticación SPIDI:', err);
          errorType = 'generic';
          errorMsg = err.message;
        }

        setError(errorMsg);
        router.replace(`/login?error=${errorType}`);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isProcessing, error };
}
