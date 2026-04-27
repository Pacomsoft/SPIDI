import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ICheckModuleAccessInputDTO, type ICheckModuleAccessResultDTO } from './adm.dto';

export interface ICheckModuleAccessUseCase
  extends IUseCase<ICheckModuleAccessInputDTO, ICheckModuleAccessResultDTO> {}
