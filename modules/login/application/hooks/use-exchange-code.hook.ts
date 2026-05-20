'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type IAuthService } from '../../domain/contracts/auth-service.interface';
import { LoginFailedError } from '../../domain/errors/login-failed.error';
import { AccountDisabledError } from '../../domain/errors/account-disabled.error';

interface IUseExchangeCodeResult {
  isProcessing: boolean;
  error: string | null;
}

export function useExchangeCode(authService: IAuthService): IUseExchangeCodeResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Prevent React Strict Mode double-invocation from consuming the code twice
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state') ?? '';
    const msError = searchParams.get('error');
    const msErrorDescription = searchParams.get('error_description');

    if (msError) {
      setIsProcessing(false);
      if (msError === 'access_denied' || (msErrorDescription?.includes('AADSTS50057'))) {
        setError('Tu cuenta está deshabilitada. Contacta al administrador.');
        router.replace('/login?error=account_disabled');
      } else {
        setError(msErrorDescription ?? `Error de Microsoft: ${msError}`);
        router.replace('/login?error=generic');
      }
      return;
    }

    if (!code) {
      setIsProcessing(false);
      setError('No se recibió el código de autorización de Microsoft.');
      router.replace('/login?error=invalid_credentials');
      return;
    }

    authService
      .getCallbackToken(code, state)
      .then((tokenResult) => {
        authService.saveMsSession(tokenResult);
        router.replace('/auth/spidi-token');
      })
      .catch((err: unknown) => {
        setIsProcessing(false);
        if (err instanceof AccountDisabledError) {
          setError(err.message);
          router.replace('/login?error=account_disabled');
        } else if (err instanceof LoginFailedError) {
          setError(err.message);
          router.replace('/login?error=invalid_credentials');
        } else {
          setError('Error inesperado durante la autenticación.');
          router.replace('/login?error=generic');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isProcessing, error };
}
