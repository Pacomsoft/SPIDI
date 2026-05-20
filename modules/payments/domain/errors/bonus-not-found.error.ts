export class BonusNotFoundError extends Error {
  constructor(id: string) {
    super(`Bonus with id ${id} not found`);
    this.name = 'BonusNotFoundError';
  }
}
