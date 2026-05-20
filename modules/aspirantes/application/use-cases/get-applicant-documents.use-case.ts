import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IApplicantDocumentDTO } from '../../domain/contracts/applicant-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetApplicantDocumentsUseCase
  implements IUseCase<string, IResultApi<IApplicantDocumentDTO[]>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(applicantId: string): Promise<IResultApi<IApplicantDocumentDTO[]>> {
    return this.repository.getDocuments(applicantId);
  }
}
