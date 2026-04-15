export class TooManyAttemptsError extends Error {
  readonly waitSeconds: number;

  constructor(waitSeconds: number = 120) {
    super('Por favor espere 2 minutos antes de intentar de nuevo');
    this.name = 'TooManyAttemptsError';
    this.waitSeconds = waitSeconds;
  }
}
