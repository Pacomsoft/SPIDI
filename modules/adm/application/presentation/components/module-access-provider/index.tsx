'use client';

import { type IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import { type ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { useSessionAccess } from '@/modules/adm/application/hooks/use-session-access.hook';
import { useGuardPage } from '@/modules/adm/application/hooks/use-guard-page.hook';
import { ModuleAccessContext } from '@/modules/adm/application/presentation/components/guard-page/module-access.context';

interface IModuleAccessProviderProps {
  children: React.ReactNode;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
}

export function ModuleAccessProvider({
  children,
  getSessionInfoUseCase,
  checkModuleAccessUseCase,
}: IModuleAccessProviderProps) {
  const { sessionInfo, isLoading } = useSessionAccess(
    getSessionInfoUseCase,
    checkModuleAccessUseCase,
  );

  const { isAllowed, allowedModules } = useGuardPage(sessionInfo?.menus ?? null, isLoading);

  return (
    <ModuleAccessContext.Provider value={{ sessionInfo, isLoading, isAllowed, allowedModules }}>
      {children}
    </ModuleAccessContext.Provider>
  );
}
