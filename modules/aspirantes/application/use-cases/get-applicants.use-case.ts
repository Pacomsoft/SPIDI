import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IApplicantListItemDTO, IApplicantFiltersDTO } from '../../domain/contracts/applicant-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetApplicantsUseCase
  implements IUseCase<IApplicantFiltersDTO, IResultApi<{ items: IApplicantListItemDTO[]; total: number }>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(
    filters: IApplicantFiltersDTO,
  ): Promise<IResultApi<{ items: IApplicantListItemDTO[]; total: number }>> {
    return this.repository.getApplicants(filters);
  }
}
