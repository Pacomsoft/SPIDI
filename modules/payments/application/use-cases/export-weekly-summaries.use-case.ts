import { type IExportWeeklySummariesUseCase } from '../../domain/contracts/export-weekly-summaries-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IWeeklySummaryFiltersDTO } from '../../domain/contracts/weekly-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportWeeklySummariesUseCase implements IExportWeeklySummariesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { filters: IWeeklySummaryFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportWeeklySummaries(input.filters, input.format);
  }
}
