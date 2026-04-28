import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';

export class DeleteApplicantUseCase
  implements IUseCase<string, IResultApi<void>>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(id: string): Promise<IResultApi<void>> {
    return this.repository.deleteApplicant(id);
  }
}
