'use client';

import { useRef } from 'react';
import { ApplicantDetailView } from '@/modules/aspirantes/application/presentation/views/applicant-detail.view';
import { createApplicantsModule } from '@/modules/aspirantes/infrastructure/dependency-injection';
import {
  createCheckModuleAccessUseCase,
  createGetSessionInfoUseCase,
} from '@/modules/adm/infrastructure/dependency-injection';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();
const getSessionInfoUseCase = createGetSessionInfoUseCase();

export function ApplicantDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createApplicantsModule(toastContext).useCases);

  return (
    <ApplicantDetailView
      getApplicantByIdUseCase={useCasesRef.current.getApplicantById}
      updateApplicantUseCase={useCasesRef.current.updateApplicant}
      deleteApplicantUseCase={useCasesRef.current.deleteApplicant}
      createProposalUseCase={useCasesRef.current.createProposal}
      getCatalogsUseCase={useCasesRef.current.getCatalogs}
      getDocumentsUseCase={useCasesRef.current.getDocuments}
      getProposalsUseCase={useCasesRef.current.getProposals}
      checkModuleAccessUseCase={checkModuleAccessUseCase}
      getSessionInfoUseCase={getSessionInfoUseCase}
    />
  );
}
