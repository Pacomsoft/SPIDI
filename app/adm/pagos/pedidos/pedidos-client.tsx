'use client';

import { useRef } from 'react';
import { createPaymentsModule } from '@/modules/payments/infrastructure/dependency-injection';
import { OrdersListView } from '@/modules/payments/application/presentation/views/orders-list.view';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function PedidosClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createPaymentsModule(toastContext).useCases);

  return (
    <OrdersListView
      getOrdersUseCase={useCasesRef.current.getOrders}
      exportOrdersUseCase={useCasesRef.current.exportOrders}
      getStoresUseCase={useCasesRef.current.getStores}
    />
  );
}

