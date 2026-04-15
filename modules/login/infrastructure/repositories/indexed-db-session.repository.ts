import { Session } from '../../domain/entities/session';
import { type ISessionRepository } from '../../domain/contracts/session-repository.interface';
import { getSpidiDb, STORE_SESSIONS } from '../../../shared/infrastructure/indexed-db/spidi-db';

const SESSION_KEY = 'current';

export class IndexedDbSessionRepository implements ISessionRepository {
  private cache: Session | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (typeof window === 'undefined') {
      this.initialized = true;
      return;
    }
    const db = await getSpidiDb();
    const raw = await db.get(STORE_SESSIONS, SESSION_KEY);
    if (raw) {
      const session = Session.restore(raw);
      this.cache = session.isExpired() ? null : session;
      if (session.isExpired()) await db.delete(STORE_SESSIONS, SESSION_KEY);
    }
    this.initialized = true;
  }

  async save(session: Session): Promise<void> {
    this.cache = session;
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    await db.put(STORE_SESSIONS, session.toPlainObject(), SESSION_KEY);
  }

  async findCurrent(): Promise<Session | null> {
    if (!this.initialized) await this.init();
    if (!this.cache) return null;
    if (this.cache.isExpired()) {
      await this.clear();
      return null;
    }
    return this.cache;
  }

  async clear(): Promise<void> {
    this.cache = null;
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    await db.delete(STORE_SESSIONS, SESSION_KEY);
  }

  async renew(session: Session): Promise<Session> {
    const renewed = session.renew();
    await this.save(renewed);
    return renewed;
  }

  /** Sync accessor using in-memory cache — safe after init() has been called */
  findCurrentSync(): Session | null {
    if (!this.cache || this.cache.isExpired()) return null;
    return this.cache;
  }
}
