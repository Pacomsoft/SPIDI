'use client';

import { DriverListView } from '@/modules/drivers/application/presentation/views/drivers-list.view';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function DriversClient() {
  const toastContext = useToast();
  const { useCases } = createDriversModule(toastContext);

  return (
    <DriverListView
      getDriversUseCase={useCases.getDrivers}
      exportDriversUseCase={useCases.exportDrivers}
      getCatalogsUseCase={useCases.getCatalogs}
    />
  );
}
