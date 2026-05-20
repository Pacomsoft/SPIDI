import { type ICreateAdjustmentUseCase } from '../../domain/contracts/create-adjustment-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type ICreateAdjustmentDTO, type IAdjustmentDetailDTO } from '../../domain/contracts/adjustment.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class CreateAdjustmentUseCase implements ICreateAdjustmentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(data: ICreateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>> {
    return this.repository.createAdjustment(data);
  }
}
