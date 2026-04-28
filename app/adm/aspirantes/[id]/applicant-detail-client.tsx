'use client';

import { ApplicantDetailView } from '@/modules/aspirantes/application/presentation/views/applicant-detail.view';
import { createApplicantsModule } from '@/modules/aspirantes/infrastructure/dependency-injection';
import {
  createCheckModuleAccessUseCase,
  createGetSessionInfoUseCase,
} from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

export function ApplicantDetailClient() {
  const toastContext = useToast();
  const { useCases } = createApplicantsModule(toastContext);
  const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
  const getSessionInfoUseCase = createGetSessionInfoUseCase();

  return (
    <ApplicantDetailView
      getApplicantByIdUseCase={useCases.getApplicantById}
      updateApplicantUseCase={useCases.updateApplicant}
      deleteApplicantUseCase={useCases.deleteApplicant}
      createProposalUseCase={useCases.createProposal}
      getCatalogsUseCase={useCases.getCatalogs}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
