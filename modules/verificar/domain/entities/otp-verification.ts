import type {
  IVerificationStateDTO,
  VerificationPhase,
} from '../contracts/verification-state.dto';
import { OtpBlockedError } from '../errors/otp-blocked.error';
import { OtpMaxAttemptsError } from '../errors/otp-max-attempts.error';

const MAX_ATTEMPTS = 3;
const MAX_RESEND = 1;
const BLOCK_DURATION_MS = 600_000; // 10 minutes

interface IOtpVerificationSchema {
  phase: VerificationPhase;
  phoneVerified: boolean;
  emailVerified: boolean;
  phoneAttempts: number;
  emailAttempts: number;
  phoneResendCount: number;
  emailResendCount: number;
  isBlocked: boolean;
  blockUntil: number | null;
}

export class OtpVerification {
  private constructor(private readonly _entity: IOtpVerificationSchema) {}

  static create(): OtpVerification {
    return new OtpVerification({
      phase: 'phone',
      phoneVerified: false,
      emailVerified: false,
      phoneAttempts: 0,
      emailAttempts: 0,
      phoneResendCount: 0,
      emailResendCount: 0,
      isBlocked: false,
      blockUntil: null,
    });
  }

  static fromDTO(dto: IVerificationStateDTO): OtpVerification {
    return new OtpVerification({ ...dto });
  }

  get phase(): VerificationPhase { return this._entity.phase; }
  get phoneVerified(): boolean { return this._entity.phoneVerified; }
  get emailVerified(): boolean { return this._entity.emailVerified; }
  get isBlocked(): boolean { return this._entity.isBlocked; }
  get blockUntil(): number | null { return this._entity.blockUntil; }

  isFullyCompleted(): boolean {
    return this._entity.phoneVerified && this._entity.emailVerified;
  }

  checkAndUnblock(): OtpVerification {
    if (this._entity.blockUntil && Date.now() >= this._entity.blockUntil) {
      return new OtpVerification({
        ...this._entity,
        isBlocked: false,
        blockUntil: null,
        phoneAttempts: 0,
        emailAttempts: 0,
      });
    }
    return this;
  }

  recordFailedAttempt(): OtpVerification {
    if (this._entity.isBlocked) throw new OtpBlockedError();

    const currentAttempts =
      this._entity.phase === 'phone'
        ? this._entity.phoneAttempts
        : this._entity.emailAttempts;
    const newAttempts = currentAttempts + 1;
    const key = this._entity.phase === 'phone' ? 'phoneAttempts' : 'emailAttempts';

    if (newAttempts >= MAX_ATTEMPTS) {
      const updated = new OtpVerification({
        ...this._entity,
        [key]: newAttempts,
        isBlocked: true,
        blockUntil: Date.now() + BLOCK_DURATION_MS,
      });
      throw new OtpBlockedError();
    }

    const attemptsRemaining = MAX_ATTEMPTS - newAttempts;
    throw new OtpMaxAttemptsError(attemptsRemaining);
  }

  advancePhase(): OtpVerification {
    if (this._entity.phase === 'phone') {
      return new OtpVerification({ ...this._entity, phase: 'email', phoneVerified: true });
    }
    if (this._entity.phase === 'email') {
      return new OtpVerification({ ...this._entity, phase: 'completed', emailVerified: true });
    }
    return this;
  }

  canResend(): boolean {
    const resendCount =
      this._entity.phase === 'phone'
        ? this._entity.phoneResendCount
        : this._entity.emailResendCount;
    return resendCount < MAX_RESEND && !this._entity.isBlocked;
  }

  recordResend(): OtpVerification {
    const key =
      this._entity.phase === 'phone' ? 'phoneResendCount' : 'emailResendCount';
    return new OtpVerification({
      ...this._entity,
      [key]:
        (this._entity.phase === 'phone'
          ? this._entity.phoneResendCount
          : this._entity.emailResendCount) + 1,
    });
  }

  isResendLimitReached(): boolean {
    const count =
      this._entity.phase === 'phone'
        ? this._entity.phoneResendCount
        : this._entity.emailResendCount;
    return count >= MAX_RESEND;
  }

  toDTO(): IVerificationStateDTO {
    return { ...this._entity };
  }
}
