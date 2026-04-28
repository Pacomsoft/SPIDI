import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantFiltersDTO } from './applicant-list.dto';

export interface IExportApplicantsInput {
  filters: IApplicantFiltersDTO;
  format: string;
}

export interface IExportApplicantsUseCase
  extends IUseCase<IExportApplicantsInput, IResultApi<Blob>> {}
