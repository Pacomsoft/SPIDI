export class SessionExpiredError extends Error {
  constructor() {
    super('La sesión ha expirado');
    this.name = 'SessionExpiredError';
  }
}
