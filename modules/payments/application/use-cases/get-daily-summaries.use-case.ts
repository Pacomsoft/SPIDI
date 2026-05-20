import { type IGetDailySummariesUseCase } from '../../domain/contracts/get-daily-summaries-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IDailySummaryFiltersDTO, type IDailySummaryListItemDTO } from '../../domain/contracts/daily-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetDailySummariesUseCase implements IGetDailySummariesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(filters: IDailySummaryFiltersDTO): Promise<IResultApi<{ items: IDailySummaryListItemDTO[]; total: number }>> {
    return this.repository.getDailySummaries(filters);
  }
}
