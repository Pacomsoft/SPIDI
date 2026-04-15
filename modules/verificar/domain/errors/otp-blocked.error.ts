export class OtpBlockedError extends Error {
  constructor() {
    super('Has superado el número máximo de intentos. Solicita un nuevo código en 10 minutos.');
    this.name = 'OtpBlockedError';
  }
}
