import { type IVerifyOtpUseCase } from '../../domain/contracts/verify-otp.use-case.interface';
import { type IVerificationStateRepository } from '../../domain/contracts/verification-state-repository.interface';
import { type IOtpService } from '../../domain/contracts/otp-service.interface';
import type { IVerifyOtpInputDTO, IVerifyOtpResultDTO } from '../../domain/contracts/verification-state.dto';
import { OtpVerification } from '../../domain/entities/otp-verification';
import { OtpCode } from '../../domain/value-objects/otp-code';
import { OtpBlockedError } from '../../domain/errors/otp-blocked.error';
import { OtpMaxAttemptsError } from '../../domain/errors/otp-max-attempts.error';

export class VerifyOtpUseCase implements IVerifyOtpUseCase {
  constructor(
    private readonly stateRepository: IVerificationStateRepository,
    private readonly otpService: IOtpService,
  ) {}

  async execute(input: IVerifyOtpInputDTO): Promise<IVerifyOtpResultDTO> {
    const dto = this.stateRepository.load();
    let verification = dto ? OtpVerification.fromDTO(dto) : OtpVerification.create();
    verification = verification.checkAndUnblock();

    if (verification.isBlocked) {
      return { success: false, attemptsRemaining: 0, isBlocked: true, phaseCompleted: false, allCompleted: false };
    }

    OtpCode.create(input.code);

    const isValid = await this.otpService.verify(input.code, input.phase);

    if (isValid) {
      const advanced = verification.advancePhase();
      this.stateRepository.save(advanced.toDTO());
      return {
        success: true,
        attemptsRemaining: 3,
        isBlocked: false,
        phaseCompleted: true,
        allCompleted: advanced.isFullyCompleted(),
      };
    }

    try {
      verification.recordFailedAttempt();
      return { success: false, attemptsRemaining: 3, isBlocked: false, phaseCompleted: false, allCompleted: false };
    } catch (err) {
      if (err instanceof OtpBlockedError) {
        const blockedDTO = { ...verification.toDTO(), isBlocked: true, blockUntil: Date.now() + 600_000 };
        this.stateRepository.save(blockedDTO);
        throw err;
      }
      if (err instanceof OtpMaxAttemptsError) {
        const updatedDTO = { ...verification.toDTO() };
        if (input.phase === 'phone') updatedDTO.phoneAttempts += 1;
        else updatedDTO.emailAttempts += 1;
        this.stateRepository.save(updatedDTO);
        throw err;
      }
      throw err;
    }
  }
}
