import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantListItemDTO, IApplicantFiltersDTO } from './applicant-list.dto';

export interface IGetApplicantsUseCase
  extends IUseCase<
    IApplicantFiltersDTO,
    IResultApi<{ items: IApplicantListItemDTO[]; total: number }>
  > {}
