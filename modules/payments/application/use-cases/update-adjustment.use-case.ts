import { type IUpdateAdjustmentUseCase } from '../../domain/contracts/update-adjustment-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IUpdateAdjustmentDTO, type IAdjustmentDetailDTO } from '../../domain/contracts/adjustment.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class UpdateAdjustmentUseCase implements IUpdateAdjustmentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { id: string; data: IUpdateAdjustmentDTO }): Promise<IResultApi<IAdjustmentDetailDTO>> {
    return this.repository.updateAdjustment(input.id, input.data);
  }
}
