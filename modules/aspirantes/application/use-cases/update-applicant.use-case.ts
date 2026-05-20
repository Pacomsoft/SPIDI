import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IApplicantDetailDTO } from '../../domain/contracts/applicant-detail.dto';
import type { IUpdateApplicantInput } from '../../domain/contracts/update-applicant-use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class UpdateApplicantUseCase
  implements IUseCase<IUpdateApplicantInput, IResultApi<IApplicantDetailDTO>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(input: IUpdateApplicantInput): Promise<IResultApi<IApplicantDetailDTO>> {
    return this.repository.updateApplicant(input.id, input.data);
  }
}
