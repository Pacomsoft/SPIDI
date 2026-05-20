import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IStoreDTO } from './order.dto';

export interface IGetStoresUseCase extends IUseCase<void, IResultApi<IStoreDTO[]>> {}
