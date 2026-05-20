export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order with id ${id} not found`);
    this.name = 'OrderNotFoundError';
  }
}
