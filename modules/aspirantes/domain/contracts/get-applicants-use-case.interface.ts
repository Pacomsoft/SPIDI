import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantListItemDTO, IApplicantFiltersDTO } from './applicant-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetApplicantsUseCase
  extends IUseCase<
    IApplicantFiltersDTO,
    IResultApi<{ items: IApplicantListItemDTO[]; total: number }>
  > {}
