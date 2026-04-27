'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { type ModuleKey } from '@/modules/adm/domain/value-objects/module-access';
import { initSessionRepository } from '@/lib/auth';

interface IRoleGuardProps {
  moduleKey: ModuleKey;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
  children: React.ReactNode;
}

export function RoleGuard({ moduleKey, checkModuleAccessUseCase, children }: IRoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      await initSessionRepository();
      const result = await checkModuleAccessUseCase.execute({ moduleKey });
      if (!result.role) {
        router.push('/login');
        return;
      }
      if (!result.hasAccess) {
        router.push('/denied');
      }
    };
    checkAccess();
  }, [moduleKey, checkModuleAccessUseCase, router]);

  return <>{children}</>;
}
