import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ICatalogItemDTO } from './driver-list.dto';

export interface IGetDriverCatalogsUseCase extends IUseCase<string, IResultApi<ICatalogItemDTO[]>> {}
