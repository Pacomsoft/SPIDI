import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { ICreateProposalDTO, IProposalDTO } from './applicant-detail.dto';

export interface ICreateProposalUseCase
  extends IUseCase<ICreateProposalDTO, IResultApi<IProposalDTO>> {}
