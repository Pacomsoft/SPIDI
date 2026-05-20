import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderFiltersDTO } from './order.dto';

export interface IExportOrdersUseCase extends IUseCase<{ filters: IOrderFiltersDTO; format: string }, IResultApi<Blob>> {}
