'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { DailySummariesListView } from '@/modules/payments/application/presentation/views/daily-summaries-list.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function DailySummariesClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <DailySummariesListView
      getDailySummariesUseCase={useCasesRef.current.getDailySummaries}
      exportDailySummariesUseCase={useCasesRef.current.exportDailySummaries}
    />
  );
}
