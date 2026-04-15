import { Session } from '../../domain/entities/session';
import { type ISessionRepository } from '../../domain/contracts/session-repository.interface';

const SESSION_KEY = 'spidi_session';

/** @deprecated — use IndexedDbSessionRepository. Kept for reference only. */
export class LocalStorageSessionRepository implements ISessionRepository {
  async init(): Promise<void> {}

  async save(session: Session): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session.toPlainObject()));
  }

  async findCurrent(): Promise<Session | null> {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      const session = Session.restore(data);
      if (session.isExpired()) {
        await this.clear();
        return null;
      }
      return session;
    } catch {
      await this.clear();
      return null;
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  }

  async renew(session: Session): Promise<Session> {
    const renewed = session.renew();
    await this.save(renewed);
    return renewed;
  }
}
