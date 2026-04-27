import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ISessionInfoDTO } from './adm.dto';

export interface IGetSessionInfoUseCase
  extends IUseCase<void, ISessionInfoDTO | null> {}
