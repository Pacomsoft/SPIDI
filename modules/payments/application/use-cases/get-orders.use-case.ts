import { type IGetOrdersUseCase } from '../../domain/contracts/get-orders-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IOrderFiltersDTO, type IOrderListItemDTO } from '../../domain/contracts/order.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetOrdersUseCase implements IGetOrdersUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(filters: IOrderFiltersDTO): Promise<IResultApi<{ items: IOrderListItemDTO[]; total: number }>> {
    return this.repository.getOrders(filters);
  }
}
