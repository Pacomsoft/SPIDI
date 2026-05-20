import { type IExportOrdersUseCase } from '../../domain/contracts/export-orders-use-case.interface';
import { type IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import { type IOrderFiltersDTO } from '../../domain/contracts/order.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportOrdersUseCase implements IExportOrdersUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: { filters: IOrderFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportOrders(input.filters, input.format);
  }
}
