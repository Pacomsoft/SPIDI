import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantDetailDTO } from './applicant-detail.dto';

export interface IUpdateApplicantInput {
  id: string;
  data: Partial<IApplicantDetailDTO>;
}

export interface IUpdateApplicantUseCase
  extends IUseCase<IUpdateApplicantInput, IResultApi<IApplicantDetailDTO>> {}
