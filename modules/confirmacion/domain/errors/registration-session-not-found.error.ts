export class RegistrationSessionNotFoundError extends Error {
  constructor() {
    super('No se encontró una sesión de registro activa.');
    this.name = 'RegistrationSessionNotFoundError';
  }
}
