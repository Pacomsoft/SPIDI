'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { BonusDetailView } from '@/modules/payments/application/presentation/views/bonus-detail.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function BonusDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <BonusDetailView
      getBonusByIdUseCase={useCasesRef.current.getBonusById}
      updateBonusUseCase={useCasesRef.current.updateBonus}
      getStoresUseCase={useCasesRef.current.getStores}
    />
  );
}
