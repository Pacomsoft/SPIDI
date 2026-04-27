'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const { status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    const checkAuth = async () => {
      if (status === 'unauthenticated') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirect_after_login', pathname);
        }
        router.push('/login');
        return;
      }

      await initSessionRepository();
      if (!authProvider.isAuthenticated()) {
        router.push('/validate-token');
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
  }, [status]);

  return { ready };
}
