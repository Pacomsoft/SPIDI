'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { authProvider, initSessionRepository } from '@/lib/auth';
import { type IEnsureTokenValidUseCase } from '../../domain/contracts/ensure-token-valid-use-case.interface';

interface IUseAuthGuardResult {
  ready: boolean;
}

export function useAuthGuard(
  ensureTokenValidUseCase: IEnsureTokenValidUseCase,
): IUseAuthGuardResult {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const checkAuth = async () => {
      if (!isAuthenticated) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirect_after_login', pathname);
        }
        router.push('/login');
        return;
      }

      await initSessionRepository();
      if (!authProvider.isAuthenticated()) {
        router.push('/validate_token');
        return;
      }

      const { isValid } = await ensureTokenValidUseCase.execute({});
      if (!isValid) {
        router.push('/login');
        return;
      }

      await authProvider.renewSession();
      setReady(true);
    };

    checkAuth();

    const interval = setInterval(checkAuth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, inProgress]);

  return { ready };
}
