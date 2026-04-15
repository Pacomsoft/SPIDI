import { type IResendOtpUseCase } from '../../domain/contracts/resend-otp.use-case.interface';
import { type IVerificationStateRepository } from '../../domain/contracts/verification-state-repository.interface';
import { type IOtpService } from '../../domain/contracts/otp-service.interface';
import type { IResendOtpInputDTO, IResendOtpResultDTO } from '../../domain/contracts/verification-state.dto';
import { OtpVerification } from '../../domain/entities/otp-verification';

const REGISTRATION_SESSION_KEY = 'spidi_step1';

export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    private readonly stateRepository: IVerificationStateRepository,
    private readonly otpService: IOtpService,
  ) {}

  async execute(input: IResendOtpInputDTO): Promise<IResendOtpResultDTO> {
    const dto = this.stateRepository.load();
    const verification = dto ? OtpVerification.fromDTO(dto) : OtpVerification.create();

    if (!verification.canResend()) {
      return { success: false, resendLimitReached: verification.isResendLimitReached() };
    }

    const sessionRaw = typeof window !== 'undefined'
      ? sessionStorage.getItem(REGISTRATION_SESSION_KEY)
      : null;
    const session = sessionRaw ? JSON.parse(sessionRaw) : {};

    await this.otpService.resend(session.telefono ?? '', session.email ?? '', input.phase);

    const updated = verification.recordResend();
    this.stateRepository.save(updated.toDTO());

    return { success: true, resendLimitReached: false };
  }
}
