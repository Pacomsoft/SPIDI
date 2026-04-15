'use client';

import { type IEnsureTokenValidUseCase } from '../../../../domain/contracts/ensure-token-valid-use-case.interface';
import { useAuthGuard } from '../../../hooks/use-auth-guard.hook';

interface IAuthGuardProps {
  children: React.ReactNode;
  ensureTokenValidUseCase: IEnsureTokenValidUseCase;
}

export function AuthGuard({ children, ensureTokenValidUseCase }: IAuthGuardProps) {
  const { ready } = useAuthGuard(ensureTokenValidUseCase);

  if (!ready) return null;
  return <>{children}</>;
}
