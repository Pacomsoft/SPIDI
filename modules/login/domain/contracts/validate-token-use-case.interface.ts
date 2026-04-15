import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IValidateTokenInputDTO, type IValidateTokenResultDTO } from './validate-token.dto';

export interface IValidateTokenUseCase
  extends IUseCase<IValidateTokenInputDTO, IValidateTokenResultDTO> {}
