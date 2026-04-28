import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type { IExportApplicantsInput } from '../../domain/contracts/export-applicants-use-case.interface';

export class ExportApplicantsUseCase
  implements IUseCase<IExportApplicantsInput, IResultApi<Blob>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(input: IExportApplicantsInput): Promise<IResultApi<Blob>> {
    return this.repository.exportApplicants(input.filters, input.format);
  }
}
