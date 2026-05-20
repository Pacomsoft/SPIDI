import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IBonusDetailDTO } from './bonus.dto';

export interface IGetBonusByIdUseCase extends IUseCase<string, IResultApi<IBonusDetailDTO>> {}
