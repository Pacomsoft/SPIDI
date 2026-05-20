import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { ICreateBonusDTO, IBonusDetailDTO } from './bonus.dto';

export interface ICreateBonusUseCase extends IUseCase<ICreateBonusDTO, IResultApi<IBonusDetailDTO>> {}
