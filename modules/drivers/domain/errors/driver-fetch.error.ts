export class DriverFetchError extends Error {
  constructor(message = 'Failed to fetch driver data') {
    super(message);
    this.name = 'DriverFetchError';
  }
}
