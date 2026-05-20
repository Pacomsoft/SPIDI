import { useState, useEffect, useCallback } from 'react';
import { type IGetSessionInfoUseCase } from '../../domain/contracts/get-session-info-use-case.interface';
import { type ICheckModuleAccessUseCase } from '../../domain/contracts/check-module-access-use-case.interface';
import { type ISessionInfoDTO } from '../../domain/contracts/adm.dto';
import { type ModuleKey, ModuleAccess } from '../../domain/value-objects/module-access';
import { type IMenuItem } from '../../domain/contracts/menu-item.interface';
import { initSessionRepository } from '@/lib/auth';

interface IUseSessionAccessResult {
  sessionInfo: ISessionInfoDTO | null;
  isLoading: boolean;
  allowedModules: IMenuItem[];
  checkAccess: (moduleKey: ModuleKey) => Promise<boolean>;
}

export function useSessionAccess(
  getSessionInfoUseCase: IGetSessionInfoUseCase,
  checkModuleAccessUseCase: ICheckModuleAccessUseCase,
): IUseSessionAccessResult {
  const [sessionInfo, setSessionInfo] = useState<ISessionInfoDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowedModules, setAllowedModules] = useState<IMenuItem[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      // Asegurar que IndexedDB esté inicializado antes de leer la sesión.
      // Esto evita que el guard evalúe con menus=null en navegaciones directas.
      await initSessionRepository();
      const info = await getSessionInfoUseCase.execute();
      setSessionInfo(info);
      if (info !== null && 'menus' in info) {
        const moduleAccess = ModuleAccess.create(info.menus);
        setAllowedModules(moduleAccess.getAllowedModules());
      }
      setIsLoading(false);
    };
    loadSession();
  }, [getSessionInfoUseCase]);

  const checkAccess = useCallback(
    async (moduleKey: ModuleKey): Promise<boolean> => {
      const result = await checkModuleAccessUseCase.execute({ moduleKey });
      return result.hasAccess;
    },
    [checkModuleAccessUseCase],
  );

  return { sessionInfo, isLoading, allowedModules, checkAccess };
}
