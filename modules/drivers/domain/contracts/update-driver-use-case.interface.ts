import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverDetailDTO } from './driver-detail.dto';
import { type IUpdateDriverDTO } from './update-driver.dto';

export interface IUpdateDriverUseCase extends IUseCase<{ id: string; data: IUpdateDriverDTO }, IResultApi<IDriverDetailDTO>> {}
