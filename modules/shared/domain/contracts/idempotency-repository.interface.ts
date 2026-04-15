export interface IIdempotencyRepository {
  addRequest(url: string): Promise<string>;
  updateRequest(url: string, newKey: string): Promise<void>;
}
