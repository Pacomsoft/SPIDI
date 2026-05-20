import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IProposalDTO } from './applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetApplicantProposalsUseCase
  extends IUseCase<string, IResultApi<IProposalDTO[]>> {}
