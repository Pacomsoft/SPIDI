import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IGetHomePageResultDTO } from './adm.dto';

export interface IGetHomePageUseCase
  extends IUseCase<void, IGetHomePageResultDTO> {}
