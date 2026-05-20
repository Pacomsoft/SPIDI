'use client';

import { useRef } from 'react';
import { DriverDetailView } from '@/modules/drivers/application/presentation/views/driver-detail.view';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { createCheckModuleAccessUseCase, createGetSessionInfoUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
const getSessionInfoUseCase = createGetSessionInfoUseCase();

export function DriverDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createDriversModule(toastContext).useCases);

  return (
    <DriverDetailView
      getDriverByIdUseCase={useCasesRef.current.getDriverById}
      updateDriverUseCase={useCasesRef.current.updateDriver}
      deleteDriverUseCase={useCasesRef.current.deleteDriver}
      getOrdersUseCase={useCasesRef.current.getOrders}
      getPaymentsUseCase={useCasesRef.current.getPayments}
      uploadDocumentUseCase={useCasesRef.current.uploadDocument}
      changeDriverStatusUseCase={useCasesRef.current.changeStatus}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
