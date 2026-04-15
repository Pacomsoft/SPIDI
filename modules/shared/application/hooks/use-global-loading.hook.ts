'use client';

import { createContext, useContext, useState } from 'react';
import type { IGlobalLoadingContext } from '@/modules/shared/domain/contracts/global-loading.interface';

const GlobalLoadingContext = createContext<IGlobalLoadingContext | null>(null);

export function useGlobalLoading(): IGlobalLoadingContext {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}

export { GlobalLoadingContext };
