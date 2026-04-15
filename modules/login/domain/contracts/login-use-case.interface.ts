import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ILoginInputDTO, type ILoginResultDTO } from './login.dto';

export interface ILoginUseCase extends IUseCase<ILoginInputDTO, ILoginResultDTO> {}
