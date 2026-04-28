import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.iterface';
import { type IOrderDTO } from './driver-detail.dto';

export interface IGetDriverOrdersUseCase extends IUseCase<{ driverId: string; pagination: IPagination }, IResultApi<{ items: IOrderDTO[]; total: number }>> {}
