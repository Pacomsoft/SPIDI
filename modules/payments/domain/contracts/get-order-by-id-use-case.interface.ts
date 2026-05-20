import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderDetailDTO } from './order.dto';

export interface IGetOrderByIdUseCase extends IUseCase<string, IResultApi<IOrderDetailDTO>> {}
