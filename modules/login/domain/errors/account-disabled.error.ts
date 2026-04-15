export class AccountDisabledError extends Error {
  constructor() {
    super('Tu cuenta está deshabilitada. Contacta al administrador.');
    this.name = 'AccountDisabledError';
  }
}
