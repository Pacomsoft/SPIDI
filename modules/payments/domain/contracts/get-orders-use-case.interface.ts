import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderFiltersDTO, IOrderListItemDTO } from './order.dto';

export interface IGetOrdersUseCase extends IUseCase<IOrderFiltersDTO, IResultApi<{ items: IOrderListItemDTO[]; total: number }>> {}
