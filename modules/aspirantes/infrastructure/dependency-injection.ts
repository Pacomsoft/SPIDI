import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import {
  createConfiguracionRepository,
  createIdempotencyRepository,
  createTokenRepository,
} from '@/modules/shared/infrastructure/dependency-injection';
import type { IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import { ApiApplicantsRepository } from './repositories/api-applicants.repository';
import { MockApplicantsRepository } from './repositories/mock-aspirantes.repository';
import { GetApplicantsUseCase } from '../application/use-cases/get-applicants.use-case';
import { GetApplicantByIdUseCase } from '../application/use-cases/get-applicant-by-id.use-case';
import { UpdateApplicantUseCase } from '../application/use-cases/update-applicant.use-case';
import { DeleteApplicantUseCase } from '../application/use-cases/delete-applicant.use-case';
import { ExportApplicantsUseCase } from '../application/use-cases/export-applicants.use-case';
import { CreateProposalUseCase } from '../application/use-cases/create-proposal.use-case';
import { GetApplicantCatalogsUseCase } from '../application/use-cases/get-applicant-catalogs.use-case';
import { GetApplicantDocumentsUseCase } from '../application/use-cases/get-applicant-documents.use-case';
import { GetApplicantProposalsUseCase } from '../application/use-cases/get-applicant-proposals.use-case';
import type { IGetApplicantsUseCase } from '../domain/contracts/get-applicants-use-case.interface';
import type { IGetApplicantByIdUseCase } from '../domain/contracts/get-applicant-by-id-use-case.interface';
import type { IUpdateApplicantUseCase } from '../domain/contracts/update-applicant-use-case.interface';
import type { IDeleteApplicantUseCase } from '../domain/contracts/delete-applicant-use-case.interface';
import type { IExportApplicantsUseCase } from '../domain/contracts/export-applicants-use-case.interface';
import type { ICreateProposalUseCase } from '../domain/contracts/create-proposal-use-case.interface';
import type { IGetApplicantCatalogsUseCase } from '../domain/contracts/get-applicant-catalogs-use-case.interface';
import type { IGetApplicantDocumentsUseCase } from '../domain/contracts/get-applicant-documents-use-case.interface';
import type { IGetApplicantProposalsUseCase } from '../domain/contracts/get-applicant-proposals-use-case.interface';

// ─── SWAP POINT ───────────────────────────────────────────────────────────────
// NEXT_PUBLIC_USE_MOCK_AUTH=true  → MockApplicantsRepository (Vercel/demo, 0 HTTP)
// Cualquier otro entorno           → ApiApplicantsRepository  (backend real + fallback mock)
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export function createApplicantsModule(toastContext?: IToastContext) {
  let repository;

  if (USE_MOCK) {
    repository = new MockApplicantsRepository();
  } else {
    const httpClient = new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', {
      configuracionRepository: createConfiguracionRepository(),
      idempotencyRepository: createIdempotencyRepository(),
      tokenRepository: createTokenRepository(),
      toastContext,
    });
    repository = new ApiApplicantsRepository(httpClient);
  }

  return {
    useCases: {
      getApplicants: new GetApplicantsUseCase(repository) as IGetApplicantsUseCase,
      getApplicantById: new GetApplicantByIdUseCase(repository) as IGetApplicantByIdUseCase,
      updateApplicant: new UpdateApplicantUseCase(repository) as IUpdateApplicantUseCase,
      deleteApplicant: new DeleteApplicantUseCase(repository) as IDeleteApplicantUseCase,
      exportApplicants: new ExportApplicantsUseCase(repository) as IExportApplicantsUseCase,
      createProposal: new CreateProposalUseCase(repository) as ICreateProposalUseCase,
      getCatalogs: new GetApplicantCatalogsUseCase(repository) as IGetApplicantCatalogsUseCase,
      getDocuments: new GetApplicantDocumentsUseCase(repository) as IGetApplicantDocumentsUseCase,
      getProposals: new GetApplicantProposalsUseCase(repository) as IGetApplicantProposalsUseCase,
    },
  };
}
