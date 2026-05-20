'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { OrderDetailView } from '@/modules/payments/application/presentation/views/order-detail.view';

export function OrderDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <OrderDetailView
      getOrderByIdUseCase={useCasesRef.current.getOrderById}
    />
  );
}
