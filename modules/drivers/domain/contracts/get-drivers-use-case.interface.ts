import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverFiltersDTO, type IDriverListItemDTO } from './driver-list.dto';

export interface IGetDriversUseCase extends IUseCase<IDriverFiltersDTO, IResultApi<{ items: IDriverListItemDTO[]; total: number }>> {}
