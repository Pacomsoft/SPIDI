'use client';

import { ApplicantListView } from '@/modules/aspirantes/application/presentation/views/applicants-list.view';
import { createApplicantsModule } from '@/modules/aspirantes/infrastructure/dependency-injection';
import {
  createCheckModuleAccessUseCase,
  createGetSessionInfoUseCase,
} from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function AspirantesClient() {
  const toastContext = useToast();
  const { useCases } = createApplicantsModule(toastContext);
  const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
  const getSessionInfoUseCase = createGetSessionInfoUseCase();

  return (
    <ApplicantListView
      getApplicantsUseCase={useCases.getApplicants}
      exportApplicantsUseCase={useCases.exportApplicants}
      getCatalogsUseCase={useCases.getCatalogs}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
