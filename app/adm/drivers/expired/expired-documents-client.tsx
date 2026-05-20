'use client';

import { useRef } from 'react';
import { ExpiredDocumentsView } from '@/modules/drivers/application/presentation/views/expired-documents.view';
import { createDriversModule } from '@/modules/drivers/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function ExpiredDocumentsClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createDriversModule(toastContext).useCases);

  return (
    <ExpiredDocumentsView
      getExpiredDocumentsUseCase={useCasesRef.current.getExpiredDocuments}
      exportExpiredDocumentsUseCase={useCasesRef.current.exportExpiredDocuments}
      getDriverByIdUseCase={useCasesRef.current.getDriverById}
      getDriverDocumentsUseCase={useCasesRef.current.getDocuments}
    />
  );
}
