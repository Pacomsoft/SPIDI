export class LoginFailedError extends Error {
  constructor(message = 'Error al iniciar sesión') {
    super(message);
    this.name = 'LoginFailedError';
  }
}
