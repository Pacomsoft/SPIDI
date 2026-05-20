import { type IGetAdjustmentsUseCase } from '../../domain/contracts/get-adjustments-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IAdjustmentFiltersDTO, type IAdjustmentListItemDTO } from '../../domain/contracts/adjustment.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetAdjustmentsUseCase implements IGetAdjustmentsUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(filters: IAdjustmentFiltersDTO): Promise<IResultApi<{ items: IAdjustmentListItemDTO[]; total: number }>> {
    return this.repository.getAdjustments(filters);
  }
}
