export class OtpMaxAttemptsError extends Error {
  constructor(public readonly attemptsRemaining: number) {
    super(`Código incorrecto. Te quedan ${attemptsRemaining} intentos.`);
    this.name = 'OtpMaxAttemptsError';
  }
}
