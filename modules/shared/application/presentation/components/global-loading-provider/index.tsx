'use client';

import { useState, useEffect } from 'react';
import { GlobalLoadingContext } from '@/modules/shared/application/hooks/use-global-loading.hook';
import { GlobalLoading } from '@/modules/shared/application/presentation/components/global-loading';
import { IndexedDbConfiguracionRepository } from '@/modules/shared/infrastructure/configuracion/indexed-db-configuracion.repository';
import { EnsureSpidiIdUseCase } from '@/modules/shared/application/use-cases/ensure-spidi-id.use-case';

const configuracionRepository = new IndexedDbConfiguracionRepository();
const ensureSpidiIdUseCase = new EnsureSpidiIdUseCase(configuracionRepository);

interface IGlobalLoadingProviderProps {
  children: React.ReactNode;
}

export function GlobalLoadingProvider({ children }: IGlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void ensureSpidiIdUseCase.execute();
  }, []);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      <GlobalLoading isLoading={isLoading} />
    </GlobalLoadingContext.Provider>
  );
}
