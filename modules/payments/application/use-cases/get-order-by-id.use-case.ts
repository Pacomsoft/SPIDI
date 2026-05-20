import { type IGetOrderByIdUseCase } from '../../domain/contracts/get-order-by-id-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IOrderDetailDTO } from '../../domain/contracts/order.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetOrderByIdUseCase implements IGetOrderByIdUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(id: string): Promise<IResultApi<IOrderDetailDTO>> {
    return this.repository.getOrderById(id);
  }
}
