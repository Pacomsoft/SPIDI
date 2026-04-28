export class DriverNotFoundError extends Error {
  constructor(driverId: string) {
    super(`Driver with ID ${driverId} not found`);
    this.name = 'DriverNotFoundError';
  }
}
