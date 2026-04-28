import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IApplicantRepository } from '../../domain/contracts/applicant-repository.interface';
import type {
  IGetApplicantCatalogsInput,
  IGetApplicantCatalogsOutput,
} from '../../domain/contracts/get-applicant-catalogs-use-case.interface';

export class GetApplicantCatalogsUseCase
  implements IUseCase<IGetApplicantCatalogsInput, IGetApplicantCatalogsOutput>
{
  constructor(private readonly repository: IApplicantRepository) {}

  async execute(input: IGetApplicantCatalogsInput): Promise<IGetApplicantCatalogsOutput> {
    const results = await Promise.allSettled(
      input.endpoints.map(async (endpoint) => {
        const result = await this.repository.getCatalogItems(endpoint);
        return { endpoint, items: result.success ? (result.data ?? []) : [] };
      }),
    );

    return results.reduce<IGetApplicantCatalogsOutput>((acc, result) => {
      if (result.status === 'fulfilled') {
        acc[result.value.endpoint] = result.value.items;
      }
      return acc;
    }, {});
  }
}
