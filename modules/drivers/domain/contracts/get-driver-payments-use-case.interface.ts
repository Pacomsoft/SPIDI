import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IPaymentWeekDTO } from './driver-detail.dto';

export interface IGetDriverPaymentsUseCase extends IUseCase<{ driverId: string; pagination: IPagination }, IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {}
