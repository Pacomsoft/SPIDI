import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type {
  IVerifyOtpInputDTO,
  IVerifyOtpResultDTO,
} from './verification-state.dto';

export interface IVerifyOtpUseCase extends IUseCase<IVerifyOtpInputDTO, IVerifyOtpResultDTO> {}
