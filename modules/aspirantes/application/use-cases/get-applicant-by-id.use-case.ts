import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IApplicantDetailDTO } from '../../domain/contracts/applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetApplicantByIdUseCase
  implements IUseCase<string, IResultApi<IApplicantDetailDTO>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
    return this.repository.getApplicantById(id);
  }
}
