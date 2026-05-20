import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import { type IOrderDTO } from './driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriverOrdersUseCase extends IUseCase<{ driverId: string; pagination: IPagination }, IResultApi<{ items: IOrderDTO[]; total: number }>> {}
