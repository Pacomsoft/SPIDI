import { type IGetAdjustmentByIdUseCase } from '../../domain/contracts/get-adjustment-by-id-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IAdjustmentDetailDTO } from '../../domain/contracts/adjustment.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetAdjustmentByIdUseCase implements IGetAdjustmentByIdUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(id: string): Promise<IResultApi<IAdjustmentDetailDTO>> {
    return this.repository.getAdjustmentById(id);
  }
}
