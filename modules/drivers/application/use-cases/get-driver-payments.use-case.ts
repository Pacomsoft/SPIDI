import { type IGetDriverPaymentsUseCase, type IGetDriverPaymentsInput } from '../../domain/contracts/get-driver-payments-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class GetDriverPaymentsUseCase implements IGetDriverPaymentsUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: IGetDriverPaymentsInput): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {
    return this.repository.getPayments(input.driverId, input.pagination, input.filterYear, input.filterWeek);
  }
}
