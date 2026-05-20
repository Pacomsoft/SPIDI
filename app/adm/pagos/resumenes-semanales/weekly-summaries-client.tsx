'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { WeeklySummariesListView } from '@/modules/payments/application/presentation/views/weekly-summaries-list.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function WeeklySummariesClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <WeeklySummariesListView
      getWeeklySummariesUseCase={useCasesRef.current.getWeeklySummaries}
      exportWeeklySummariesUseCase={useCasesRef.current.exportWeeklySummaries}
    />
  );
}
