'use client';

import { createContext, useContext } from 'react';
import { type IMenuItem } from '@/modules/adm/domain/contracts/menu-item.interface';
import { type ISessionInfoDTO } from '@/modules/adm/domain/contracts/adm.dto';

interface IModuleAccessContext {
  allowedModules: IMenuItem[];
  sessionInfo: ISessionInfoDTO | null;
  isLoading: boolean;
  isAllowed: boolean;
}

export const ModuleAccessContext = createContext<IModuleAccessContext | null>(null);

export function useModuleAccessContext(): IModuleAccessContext {
  const ctx = useContext(ModuleAccessContext);
  if (!ctx) throw new Error('useModuleAccessContext must be used within ModuleAccessProvider');
  return ctx;
}
