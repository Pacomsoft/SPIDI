import { type IGetWeeklySummaryByIdUseCase } from '../../domain/contracts/get-weekly-summary-by-id-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IWeeklySummaryDetailDTO } from '../../domain/contracts/weekly-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetWeeklySummaryByIdUseCase implements IGetWeeklySummaryByIdUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(id: string): Promise<IResultApi<IWeeklySummaryDetailDTO>> {
    return this.repository.getWeeklySummaryById(id);
  }
}
