'use client';

import { useRef } from 'react';
import { ApplicantListView } from '@/modules/aspirantes/application/presentation/views/applicants-list.view';
import { createApplicantsModule } from '@/modules/aspirantes/infrastructure/dependency-injection';
import {
  createCheckModuleAccessUseCase,
  createGetSessionInfoUseCase,
} from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

// Instancias estables que no dependen de toastContext para evitar recreación
const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
const getSessionInfoUseCase = createGetSessionInfoUseCase();

export function AspirantesClient() {
  const toastContext = useToast();

  // useRef garantiza una única instancia por montaje del componente,
  // sin importar cuántos re-renders ocurran
  const useCasesRef = useRef(createApplicantsModule(toastContext).useCases);

  return (
    <ApplicantListView
      getApplicantsUseCase={useCasesRef.current.getApplicants}
      exportApplicantsUseCase={useCasesRef.current.exportApplicants}
      getCatalogsUseCase={useCasesRef.current.getCatalogs}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
