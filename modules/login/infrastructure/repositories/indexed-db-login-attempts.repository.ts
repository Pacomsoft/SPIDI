import { LoginAttempt } from '../../domain/entities/login-attempt';
import { type ILoginAttemptsRepository } from '../../domain/contracts/login-attempts-repository.interface';
import { getSpidiDb, STORE_LOGIN_ATTEMPTS } from '../../../shared/infrastructure/indexed-db/spidi-db';

export class IndexedDbLoginAttemptsRepository implements ILoginAttemptsRepository {
  async record(): Promise<void> {
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    const attempt = LoginAttempt.create();
    await db.add(STORE_LOGIN_ATTEMPTS, attempt.timestamp);
  }

  async getRecentCount(windowMs: number): Promise<number> {
    if (typeof window === 'undefined') return 0;
    const db = await getSpidiDb();
    const all: number[] = await db.getAll(STORE_LOGIN_ATTEMPTS);
    const cutoff = Date.now() - windowMs;
    return all.filter((ts) => ts >= cutoff).length;
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    await db.clear(STORE_LOGIN_ATTEMPTS);
  }
}
