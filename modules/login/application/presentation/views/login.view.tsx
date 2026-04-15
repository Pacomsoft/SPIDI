'use client';

import { type ILoginUseCase } from '../../../domain/contracts/login-use-case.interface';
import { type ILoginAttemptsRepository } from '../../../domain/contracts/login-attempts-repository.interface';
import { useLogin } from '../../hooks/use-login.hook';
import { LoginCard } from '../components/login-card';

interface ILoginViewProps {
  loginUseCase: ILoginUseCase;
  attemptsRepository: ILoginAttemptsRepository;
}

export function LoginView({ loginUseCase, attemptsRepository }: ILoginViewProps) {
  const { isLoading, error, errorType, isLockedOut, lockoutSecondsLeft, handleLogin } =
    useLogin(loginUseCase, attemptsRepository);

  return (
    <LoginCard
      isLoading={isLoading}
      error={error}
      errorType={errorType}
      isLockedOut={isLockedOut}
      lockoutSecondsLeft={lockoutSecondsLeft}
      onLogin={handleLogin}
    />
  );
}
