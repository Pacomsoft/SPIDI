export class OtpExpiredError extends Error {
  constructor() {
    super('El código ha expirado. Por favor solicita uno nuevo.');
    this.name = 'OtpExpiredError';
  }
}
