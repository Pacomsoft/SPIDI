'use client';

import { createValidateTokenUseCase } from '@/modules/login/infrastructure/dependency-injection';
import { ValidateTokenView } from '@/modules/login/application/presentation/views/validate-token.view';

const validateTokenUseCase = createValidateTokenUseCase();

export function ValidateTokenClient() {
  return <ValidateTokenView validateTokenUseCase={validateTokenUseCase} />;
}
