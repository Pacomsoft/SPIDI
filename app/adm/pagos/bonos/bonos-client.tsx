'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { BonusesListView } from '@/modules/payments/application/presentation/views/bonuses-list.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function BonosClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <BonusesListView
      getBonusesUseCase={useCasesRef.current.getBonuses}
      exportBonusesUseCase={useCasesRef.current.exportBonuses}
      createBonusUseCase={useCasesRef.current.createBonus}
      getStoresUseCase={useCasesRef.current.getStores}
    />
  );
}
