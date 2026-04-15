'use client';

import { createLoginUseCase, createLoginAttemptsRepository } from '@/modules/login/infrastructure/dependency-injection';
import { LoginView } from '@/modules/login/application/presentation/views/login.view';

const loginUseCase = createLoginUseCase();
const attemptsRepository = createLoginAttemptsRepository();

export function LoginClient() {
  return <LoginView loginUseCase={loginUseCase} attemptsRepository={attemptsRepository} />;
}
