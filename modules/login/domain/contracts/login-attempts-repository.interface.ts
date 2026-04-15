export interface ILoginAttemptsRepository {
  record(): Promise<void>;
  getRecentCount(windowMs: number): Promise<number>;
  clear(): Promise<void>;
}
