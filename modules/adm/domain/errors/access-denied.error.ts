export class AccessDeniedError extends Error {
  constructor(role: string, moduleKey: string) {
    super(`Rol '${role}' no tiene acceso al módulo '${moduleKey}'`);
    this.name = 'AccessDeniedError';
  }
}
