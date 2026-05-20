import { type IGetDailySummaryByIdUseCase } from '../../domain/contracts/get-daily-summary-by-id-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IDailySummaryDetailDTO } from '../../domain/contracts/daily-summary.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetDailySummaryByIdUseCase implements IGetDailySummaryByIdUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(id: string): Promise<IResultApi<IDailySummaryDetailDTO>> {
    return this.repository.getDailySummaryById(id);
  }
}
