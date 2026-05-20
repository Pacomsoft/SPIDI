import { type ICreateBonusUseCase } from '../../domain/contracts/create-bonus-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type ICreateBonusDTO, type IBonusDetailDTO } from '../../domain/contracts/bonus.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class CreateBonusUseCase implements ICreateBonusUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(data: ICreateBonusDTO): Promise<IResultApi<IBonusDetailDTO>> {
    return this.repository.createBonus(data);
  }
}
