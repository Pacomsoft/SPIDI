import { type IVerificationStateRepository } from '../domain/contracts/verification-state-repository.interface';
import { type IOtpService } from '../domain/contracts/otp-service.interface';
import { type IVerifyOtpUseCase } from '../domain/contracts/verify-otp.use-case.interface';
import { type IResendOtpUseCase } from '../domain/contracts/resend-otp.use-case.interface';
import { type ISubmitRegistrationUseCase } from '../domain/contracts/submit-registration.use-case.interface';
import { type IConfiguracionRepository } from '@/modules/shared/domain/contracts/configuracion-repository.interface';
import { SessionVerificationStateRepository } from './repositories/session-verification-state.repository';
import { MockOtpService } from './services/mock-otp.service';
import { VerifyOtpUseCase } from '../application/use-cases/verify-otp.use-case';
import { ResendOtpUseCase } from '../application/use-cases/resend-otp.use-case';
import { SubmitRegistrationUseCase } from '../application/use-cases/submit-registration.use-case';

export function createVerificationStateRepository(): IVerificationStateRepository {
  return new SessionVerificationStateRepository();
}

export function createOtpService(): IOtpService {
  return new MockOtpService();
}

export function createVerifyOtpUseCase(
  stateRepo: IVerificationStateRepository,
  otpService: IOtpService,
): IVerifyOtpUseCase {
  return new VerifyOtpUseCase(stateRepo, otpService);
}

export function createResendOtpUseCase(
  stateRepo: IVerificationStateRepository,
  otpService: IOtpService,
): IResendOtpUseCase {
  return new ResendOtpUseCase(stateRepo, otpService);
}

export function createSubmitRegistrationUseCase(
  stateRepo: IVerificationStateRepository,
  otpService: IOtpService,
  configuracionRepository: IConfiguracionRepository,
): ISubmitRegistrationUseCase {
  return new SubmitRegistrationUseCase(stateRepo, otpService, configuracionRepository);
}

export function createVerificarModule(configuracionRepository: IConfiguracionRepository) {
  const stateRepo = createVerificationStateRepository();
  const otpService = createOtpService();
  return {
    useCases: {
      verifyOtp: createVerifyOtpUseCase(stateRepo, otpService),
      resendOtp: createResendOtpUseCase(stateRepo, otpService),
      submitRegistration: createSubmitRegistrationUseCase(stateRepo, otpService, configuracionRepository),
    },
  };
}
