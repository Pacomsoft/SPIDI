'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { WeeklySummaryDetailView } from '@/modules/payments/application/presentation/views/weekly-summary-detail.view';

export function WeeklySummaryDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <WeeklySummaryDetailView
      getWeeklySummaryByIdUseCase={useCasesRef.current.getWeeklySummaryById}
    />
  );
}
