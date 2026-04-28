import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { ICatalogItemDTO } from './applicant-list.dto';

export interface IGetApplicantCatalogsInput {
  endpoints: string[];
}

export interface IGetApplicantCatalogsOutput {
  [endpoint: string]: ICatalogItemDTO[];
}

export interface IGetApplicantCatalogsUseCase
  extends IUseCase<IGetApplicantCatalogsInput, IGetApplicantCatalogsOutput> {}
