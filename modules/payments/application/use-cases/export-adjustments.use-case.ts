import { type IExportAdjustmentsUseCase } from '../../domain/contracts/export-adjustments-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IAdjustmentFiltersDTO } from '../../domain/contracts/adjustment.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportAdjustmentsUseCase implements IExportAdjustmentsUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { filters: IAdjustmentFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportAdjustments(input.filters, input.format);
  }
}
