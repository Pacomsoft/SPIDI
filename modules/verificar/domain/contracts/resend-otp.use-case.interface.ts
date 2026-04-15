import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type {
  IResendOtpInputDTO,
  IResendOtpResultDTO,
} from './verification-state.dto';

export interface IResendOtpUseCase extends IUseCase<IResendOtpInputDTO, IResendOtpResultDTO> {}
