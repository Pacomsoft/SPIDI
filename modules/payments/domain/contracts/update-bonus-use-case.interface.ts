import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IUpdateBonusDTO, IBonusDetailDTO } from './bonus.dto';

export interface IUpdateBonusUseCase extends IUseCase<{ id: string; data: IUpdateBonusDTO }, IResultApi<IBonusDetailDTO>> {}
