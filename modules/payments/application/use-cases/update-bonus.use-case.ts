import { type IUpdateBonusUseCase } from '../../domain/contracts/update-bonus-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IUpdateBonusDTO, type IBonusDetailDTO } from '../../domain/contracts/bonus.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class UpdateBonusUseCase implements IUpdateBonusUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { id: string; data: IUpdateBonusDTO }): Promise<IResultApi<IBonusDetailDTO>> {
    return this.repository.updateBonus(input.id, input.data);
  }
}
