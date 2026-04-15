export class StatesFetchError extends Error {
  constructor(message = 'No se pudieron cargar los estados. Intenta de nuevo más tarde.') {
    super(message);
    this.name = 'StatesFetchError';
  }
}
