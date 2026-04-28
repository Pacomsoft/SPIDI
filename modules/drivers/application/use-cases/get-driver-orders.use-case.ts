import { type IGetDriverOrdersUseCase } from '../../domain/contracts/get-driver-orders-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IOrderDTO } from '../../domain/contracts/driver-detail.dto';

export class GetDriverOrdersUseCase implements IGetDriverOrdersUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: { driverId: string; pagination: IPagination }): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>> {
    return this.repository.getOrders(input.driverId, input.pagination);
  }
}
