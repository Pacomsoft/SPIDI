import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantDetailDTO } from './applicant-detail.dto';

export interface IGetApplicantByIdUseCase
  extends IUseCase<string, IResultApi<IApplicantDetailDTO>> {}
