'use client';

import { createAuthService } from '@/modules/login/infrastructure/dependency-injection';
import { ValidateTokenView } from '@/modules/login/application/presentation/views/validate-token.view';

const authService = createAuthService();

export function ValidateTokenClient() {
  return <ValidateTokenView authService={authService} />;
}
