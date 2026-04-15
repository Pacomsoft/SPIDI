export type VerificationPhase = 'phone' | 'email' | 'completed';

export interface IVerificationStateDTO {
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

export interface IVerifyOtpInputDTO {
  code: string;
  phase: VerificationPhase;
}

export interface IVerifyOtpResultDTO {
  success: boolean;
  attemptsRemaining: number;
  isBlocked: boolean;
  phaseCompleted: boolean;
  allCompleted: boolean;
}

export interface IResendOtpInputDTO {
  phase: VerificationPhase;
}

export interface IResendOtpResultDTO {
  success: boolean;
  resendLimitReached: boolean;
}
