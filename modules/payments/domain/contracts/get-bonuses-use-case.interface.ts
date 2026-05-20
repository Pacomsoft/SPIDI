import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IBonusFiltersDTO, IBonusListItemDTO } from './bonus.dto';

export interface IGetBonusesUseCase extends IUseCase<IBonusFiltersDTO, IResultApi<{ items: IBonusListItemDTO[]; total: number }>> {}
