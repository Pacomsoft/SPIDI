import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverDetailDTO } from './driver-detail.dto';
import { type IUpdateDriverDTO } from './update-driver.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IUpdateDriverUseCase extends IUseCase<{ id: string; data: IUpdateDriverDTO }, IResultApi<IDriverDetailDTO>> {}
