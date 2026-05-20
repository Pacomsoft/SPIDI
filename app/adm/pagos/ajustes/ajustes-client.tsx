'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { AdjustmentsListView } from '@/modules/payments/application/presentation/views/adjustments-list.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function AjustesClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);
  const driverUseCasesRef = useRef(createDriversModule(toastContext).useCases);

  return (
    <AdjustmentsListView
      getAdjustmentsUseCase={useCasesRef.current.getAdjustments}
      exportAdjustmentsUseCase={useCasesRef.current.exportAdjustments}
      createAdjustmentUseCase={useCasesRef.current.createAdjustment}
      getStoresUseCase={useCasesRef.current.getStores}
      getDriversUseCase={driverUseCasesRef.current.getDrivers}
    />
  );
}
