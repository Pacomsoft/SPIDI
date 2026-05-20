import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantDocumentDTO } from './applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetApplicantDocumentsUseCase
  extends IUseCase<string, IResultApi<IApplicantDocumentDTO[]>> {}
