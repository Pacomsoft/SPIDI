import { type IGetDriverPaymentsUseCase } from '../../domain/contracts/get-driver-payments-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';

export class GetDriverPaymentsUseCase implements IGetDriverPaymentsUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: { driverId: string; pagination: IPagination }): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {
    return this.repository.getPayments(input.driverId, input.pagination);
  }
}
