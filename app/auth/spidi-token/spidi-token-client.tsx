'use client';

import { createAuthService, createValidateTokenUseCase } from '@/modules/login/infrastructure/dependency-injection';
import { useGetSpidiToken } from '@/modules/login/application/hooks/use-get-spidi-token.hook';
import { ValidateTokenLoader } from '@/modules/login/application/presentation/components/validate-token-loader';

const validateTokenUseCase = createValidateTokenUseCase();
const authService = createAuthService();

export function SpidiTokenClient() {
  const { isProcessing } = useGetSpidiToken(validateTokenUseCase, authService);
  return <ValidateTokenLoader isProcessing={isProcessing} />;
}
