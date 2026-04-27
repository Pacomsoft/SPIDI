'use client';

import { type IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import { type ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { ModuleAccess, PermissionAction } from '@/modules/adm/domain/value-objects/module-access';
import { useSessionAccess } from '../../../hooks/use-session-access.hook';

interface IAccessGuardProps {
  children: React.ReactNode;
  code: string;
  action: PermissionAction;
  fallback?: React.ReactNode | null;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
}

export function AccessGuard({
  children,
  code,
  action,
  fallback = null,
  getSessionInfoUseCase,
  checkModuleAccessUseCase,
}: IAccessGuardProps) {
  const { sessionInfo, isLoading } = useSessionAccess(
    getSessionInfoUseCase,
    checkModuleAccessUseCase,
  );

  if (isLoading) return null;

  if (!sessionInfo) return <>{fallback}</>;

  const canAccess = ModuleAccess.create(sessionInfo.menus).canAccess(code, action);

  return <>{canAccess ? children : fallback}</>;
}
