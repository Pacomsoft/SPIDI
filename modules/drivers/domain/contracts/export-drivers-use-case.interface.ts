import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverFiltersDTO } from './driver-list.dto';

export interface IExportDriversUseCase extends IUseCase<{ filters: IDriverFiltersDTO; format: string }, IResultApi<Blob>> {}
