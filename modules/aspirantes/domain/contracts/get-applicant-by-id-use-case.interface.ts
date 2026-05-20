import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantDetailDTO } from './applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetApplicantByIdUseCase
  extends IUseCase<string, IResultApi<IApplicantDetailDTO>> {}
