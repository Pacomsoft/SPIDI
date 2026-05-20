'use client';

import { useRef } from 'react';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { AdjustmentDetailView } from '@/modules/payments/application/presentation/views/adjustment-detail.view';

export function AdjustmentDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <AdjustmentDetailView
      getAdjustmentByIdUseCase={useCasesRef.current.getAdjustmentById}
      updateAdjustmentUseCase={useCasesRef.current.updateAdjustment}
      getStoresUseCase={useCasesRef.current.getStores}
    />
  );
}
