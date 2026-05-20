import { type IExportDailySummariesUseCase } from '../../domain/contracts/export-daily-summaries-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IDailySummaryFiltersDTO } from '../../domain/contracts/daily-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportDailySummariesUseCase implements IExportDailySummariesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { filters: IDailySummaryFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportDailySummaries(input.filters, input.format);
  }
}
