'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ILoginUseCase } from '../../domain/contracts/login-use-case.interface';
import { type ILoginAttemptsRepository } from '../../domain/contracts/login-attempts-repository.interface';
import { TooManyAttemptsError } from '../../domain/errors/too-many-attempts.error';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 2 * 60 * 1000;
const LOCKOUT_DURATION_S = 120;

export type LoginErrorType = 'invalid_credentials' | 'too_many_attempts' | 'account_disabled' | 'generic';

interface IUseLoginResult {
  isLoading: boolean;
  error: string | null;
  errorType: LoginErrorType | null;
  isLockedOut: boolean;
  lockoutSecondsLeft: number;
  handleLogin: () => Promise<void>;
}

export function useLogin(
  loginUseCase: ILoginUseCase,
  attemptsRepository: ILoginAttemptsRepository,
): IUseLoginResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<LoginErrorType | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  // Read error coming from /validate_token redirect
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (!errorParam) return;
    if (errorParam === 'too_many_attempts') {
      setErrorType('too_many_attempts');
      setError('Por favor espere 2 minutos antes de intentar de nuevo');
      setIsLockedOut(true);
      setLockoutSecondsLeft(LOCKOUT_DURATION_S);
    } else if (errorParam === 'invalid_credentials') {
      setErrorType('invalid_credentials');
      setError('Credenciales no válidas, por favor vuelve a intentar.');
    } else if (errorParam === 'account_disabled') {
      setErrorType('account_disabled');
      setError('Tu cuenta está deshabilitada. Contacta al administrador.');
    } else if (errorParam === 'generic') {
      setErrorType('generic');
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.');
    }
    // Clean URL param without reload
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('error');
    router.replace(`/login${params.size ? `?${params}` : ''}`);
  }, [searchParams, router]);

  // Countdown for lockout
  useEffect(() => {
    if (!isLockedOut || lockoutSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setError(null);
          setErrorType(null);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutSecondsLeft]);

  // Check initial lockout state from IndexedDB on mount
  useEffect(() => {
    attemptsRepository.getRecentCount(LOCKOUT_WINDOW_MS).then((count) => {
      if (count >= LOCKOUT_ATTEMPTS) {
        setIsLockedOut(true);
        setLockoutSecondsLeft(LOCKOUT_DURATION_S);
      }
    });
  }, [attemptsRepository]);

  const handleLogin = useCallback(async () => {
    if (isLockedOut) return;
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      await loginUseCase.execute({});
      // Page will redirect to Microsoft — no further state update needed
    } catch (err) {
      if (err instanceof TooManyAttemptsError) {
        setErrorType('too_many_attempts');
        setError(err.message);
        setIsLockedOut(true);
        setLockoutSecondsLeft(err.waitSeconds);
      } else {
        setErrorType('generic');
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
      setIsLoading(false);
    }
  }, [loginUseCase, isLockedOut]);

  return { isLoading, error, errorType, isLockedOut, lockoutSecondsLeft, handleLogin };
}
