'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { type IValidateTokenUseCase } from '../../domain/contracts/validate-token-use-case.interface';
import { TooManyAttemptsError } from '../../domain/errors/too-many-attempts.error';
import { AccountDisabledError } from '../../domain/errors/account-disabled.error';

type ValidateErrorType = 'invalid_credentials' | 'too_many_attempts' | 'account_disabled' | 'generic';

interface IUseValidateTokenResult {
  isProcessing: boolean;
  error: string | null;
  errorType: ValidateErrorType | null;
}

export function useValidateToken(
  validateTokenUseCase: IValidateTokenUseCase,
): IUseValidateTokenResult {
  const router = useRouter();
  const { inProgress } = useMsal();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ValidateErrorType | null>(null);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const redirectAfterLogin =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('redirect_after_login') ?? undefined)
        : undefined;

    validateTokenUseCase
      .execute({ redirectAfterLogin })
      .then((result) => {
        router.replace(result.redirectPath);
      })
      .catch((err: unknown) => {
        setIsProcessing(false);
        if (err instanceof TooManyAttemptsError) {
          setErrorType('too_many_attempts');
          setError(err.message);
          router.replace('/login?error=too_many_attempts');
        } else if (err instanceof AccountDisabledError) {
          setErrorType('account_disabled');
          setError(err.message);
          router.replace('/login?error=account_disabled');
        } else {
          setErrorType('invalid_credentials');
          setError('Credenciales no válidas, por favor vuelve a intentar.');
          router.replace('/login?error=invalid_credentials');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress]);

  return { isProcessing, error, errorType };
}
