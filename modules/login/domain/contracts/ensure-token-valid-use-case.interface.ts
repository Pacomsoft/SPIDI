import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';

export interface IEnsureTokenValidInputDTO {}

export interface IEnsureTokenValidResultDTO {
  isValid: boolean;
}

export interface IEnsureTokenValidUseCase
  extends IUseCase<IEnsureTokenValidInputDTO, IEnsureTokenValidResultDTO> {}
