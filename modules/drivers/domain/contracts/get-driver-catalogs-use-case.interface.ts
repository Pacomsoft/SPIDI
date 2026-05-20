import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ICatalogItemDTO } from './driver-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriverCatalogsUseCase extends IUseCase<string, IResultApi<ICatalogItemDTO[]>> {}
