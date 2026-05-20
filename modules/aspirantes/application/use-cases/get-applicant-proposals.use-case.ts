import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IProposalDTO } from '../../domain/contracts/applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetApplicantProposalsUseCase
  implements IUseCase<string, IResultApi<IProposalDTO[]>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(applicantId: string): Promise<IResultApi<IProposalDTO[]>> {
    return this.repository.getProposals(applicantId);
  }
}
