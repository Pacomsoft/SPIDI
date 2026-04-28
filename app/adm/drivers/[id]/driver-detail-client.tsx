'use client';

import { DriverDetailView } from '@/modules/drivers/application/presentation/views/driver-detail.view';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { createCheckModuleAccessUseCase, createGetSessionInfoUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function DriverDetailClient() {
  const toastContext = useToast();
  const { useCases } = createDriversModule(toastContext);
  const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
  const getSessionInfoUseCase = createGetSessionInfoUseCase();

  return (
    <DriverDetailView
      getDriverByIdUseCase={useCases.getDriverById}
      updateDriverUseCase={useCases.updateDriver}
      deleteDriverUseCase={useCases.deleteDriver}
      getOrdersUseCase={useCases.getOrders}
      getPaymentsUseCase={useCases.getPayments}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
