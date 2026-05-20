import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverFiltersDTO, type IDriverListItemDTO } from './driver-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriversUseCase extends IUseCase<IDriverFiltersDTO, IResultApi<{ items: IDriverListItemDTO[]; total: number }>> {}
