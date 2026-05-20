import { type IGetBonusByIdUseCase } from '../../domain/contracts/get-bonus-by-id-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IBonusDetailDTO } from '../../domain/contracts/bonus.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetBonusByIdUseCase implements IGetBonusByIdUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(id: string): Promise<IResultApi<IBonusDetailDTO>> {
    return this.repository.getBonusById(id);
  }
}
