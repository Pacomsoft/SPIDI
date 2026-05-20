import { type IGetWeeklySummariesUseCase } from '../../domain/contracts/get-weekly-summaries-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IWeeklySummaryFiltersDTO, type IWeeklySummaryListItemDTO } from '../../domain/contracts/weekly-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetWeeklySummariesUseCase implements IGetWeeklySummariesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(filters: IWeeklySummaryFiltersDTO): Promise<IResultApi<{ items: IWeeklySummaryListItemDTO[]; total: number }>> {
    return this.repository.getWeeklySummaries(filters);
  }
}
