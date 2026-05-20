'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { DailySummaryDetailView } from '@/modules/payments/application/presentation/views/daily-summary-detail.view';

export function DailySummaryDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <DailySummaryDetailView
      getDailySummaryByIdUseCase={useCasesRef.current.getDailySummaryById}
    />
  );
}
