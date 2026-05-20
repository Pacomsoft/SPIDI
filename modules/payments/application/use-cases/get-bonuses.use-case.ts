import { type IGetBonusesUseCase } from '../../domain/contracts/get-bonuses-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IBonusFiltersDTO, type IBonusListItemDTO } from '../../domain/contracts/bonus.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetBonusesUseCase implements IGetBonusesUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(filters: IBonusFiltersDTO): Promise<IResultApi<{ items: IBonusListItemDTO[]; total: number }>> {
    return this.repository.getBonuses(filters);
  }
}
