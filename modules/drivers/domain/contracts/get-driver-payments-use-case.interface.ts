import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import { type IPaymentWeekDTO } from './driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriverPaymentsInput {
  driverId: string;
  pagination: IPagination;
  filterYear?: number;
  filterWeek?: number;
}

export interface IGetDriverPaymentsUseCase extends IUseCase<IGetDriverPaymentsInput, IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {}
