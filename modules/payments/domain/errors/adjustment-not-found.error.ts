export class AdjustmentNotFoundError extends Error {
  constructor(id: string) {
    super(`Adjustment with id ${id} not found`);
    this.name = 'AdjustmentNotFoundError';
  }
}
