import { type IGetStoresUseCase } from '../../domain/contracts/get-stores-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IStoreDTO } from '../../domain/contracts/order.dto';

export class GetStoresUseCase implements IGetStoresUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(): Promise<IResultApi<IStoreDTO[]>> {
    return this.repository.getStores();
  }
}
