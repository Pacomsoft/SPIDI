import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDriverDetailDTO } from './driver-detail.dto';

export interface IGetDriverByIdUseCase extends IUseCase<string, IResultApi<IDriverDetailDTO>> {}
