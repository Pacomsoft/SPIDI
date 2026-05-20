import { type IExportBonusesUseCase } from '../../domain/contracts/export-bonuses-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IBonusFiltersDTO } from '../../domain/contracts/bonus.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportBonusesUseCase implements IExportBonusesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { filters: IBonusFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportBonuses(input.filters, input.format);
  }
}
