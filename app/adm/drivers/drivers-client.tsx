'use client';

import { useRef } from 'react';
import { DriverListView } from '@/modules/drivers/application/presentation/views/drivers-list.view';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function DriversClient() {
  const toastContext = useToast();

  // useRef garantiza una única instancia por montaje del componente,
  // sin importar cuántos re-renders ocurran
  const useCasesRef = useRef(createDriversModule(toastContext).useCases);

  return (
    <DriverListView
      getDriversUseCase={useCasesRef.current.getDrivers}
      exportDriversUseCase={useCasesRef.current.exportDrivers}
      getCatalogsUseCase={useCasesRef.current.getCatalogs}
    />
  );
}
