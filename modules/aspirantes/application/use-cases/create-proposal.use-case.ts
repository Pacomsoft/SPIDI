import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { ICreateProposalDTO, IProposalDTO } from '../../domain/contracts/applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class CreateProposalUseCase
  implements IUseCase<ICreateProposalDTO, IResultApi<IProposalDTO>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(data: ICreateProposalDTO): Promise<IResultApi<IProposalDTO>> {
    return this.repository.createProposal(data);
  }
}
